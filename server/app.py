"""NEURAL//60 scores. Run: python -m uvicorn app:app --host 127.0.0.1 --port 8951"""

import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
DB = Path(__file__).resolve().parent / "neural60.db"
KEY_FILE = Path(__file__).resolve().parent / ".admin_key"
NAME_RE = re.compile(r"^[A-Za-z0-9_-]{1,16}$")
MAX_SCORE = 30000

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)


def connect():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init():
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS games (
              id INTEGER PRIMARY KEY,
              username TEXT NOT NULL,
              score INTEGER NOT NULL,
              played_at TEXT NOT NULL,
              duration REAL NOT NULL,
              correct_answers INTEGER NOT NULL,
              wrong_answers INTEGER NOT NULL,
              max_combo INTEGER NOT NULL,
              game_version TEXT NOT NULL
            )
            """
        )
    if not KEY_FILE.exists():
        KEY_FILE.write_text(secrets.token_urlsafe(24), encoding="utf-8")


def admin_key():
    return KEY_FILE.read_text(encoding="utf-8").strip()


def require_admin(value: str | None):
    if not value or not secrets.compare_digest(value.strip(), admin_key()):
        raise HTTPException(status_code=401, detail="unauthorized")


def top_rows(conn, limit=3):
    rows = conn.execute(
        """
        SELECT username, score FROM games
        ORDER BY score DESC, played_at ASC, id ASC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [{"username": row["username"], "score": row["score"]} for row in rows]


class GameIn(BaseModel):
    username: str
    score: int = Field(ge=0, le=MAX_SCORE)
    duration: float = Field(ge=0, le=120)
    correct_answers: int = Field(ge=0, le=200)
    wrong_answers: int = Field(ge=0, le=200)
    max_combo: int = Field(ge=0, le=200)
    game_version: str = Field(min_length=1, max_length=16)


@app.get("/api/leaderboard")
def leaderboard():
    with connect() as conn:
        return {"top": top_rows(conn)}


@app.post("/api/games")
def save_game(body: GameIn):
    username = body.username.strip()
    if not NAME_RE.fullmatch(username):
        raise HTTPException(status_code=400, detail="username")
    if body.max_combo > body.correct_answers:
        raise HTTPException(status_code=400, detail="combo")
    played = datetime.now(timezone.utc).isoformat()
    with connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO games
              (username, score, played_at, duration, correct_answers, wrong_answers, max_combo, game_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                username,
                body.score,
                played,
                body.duration,
                body.correct_answers,
                body.wrong_answers,
                body.max_combo,
                body.game_version,
            ),
        )
        game_id = cur.lastrowid
        ahead = conn.execute(
            """
            SELECT COUNT(*) AS n FROM games
            WHERE score > ? OR (score = ? AND (played_at < ? OR (played_at = ? AND id < ?)))
            """,
            (body.score, body.score, played, played, game_id),
        ).fetchone()["n"]
        rank = ahead + 1
        return {"rank": rank if rank <= 3 else None, "top": top_rows(conn)}


@app.get("/api/admin/overview")
def overview(x_admin_key: str | None = Header(default=None)):
    require_admin(x_admin_key)
    with connect() as conn:
        players = conn.execute("SELECT COUNT(DISTINCT username) AS n FROM games").fetchone()["n"]
        games = conn.execute("SELECT COUNT(*) AS n FROM games").fetchone()["n"]
        avg = conn.execute("SELECT AVG(score) AS n FROM games").fetchone()["n"] or 0
        high = conn.execute("SELECT MAX(score) AS n FROM games").fetchone()["n"] or 0
        totals = conn.execute(
            "SELECT COALESCE(SUM(correct_answers), 0) AS c, COALESCE(SUM(wrong_answers), 0) AS w, AVG(duration) AS d FROM games"
        ).fetchone()
        returning = conn.execute(
            "SELECT COUNT(*) AS n FROM (SELECT username FROM games GROUP BY username HAVING COUNT(*) > 1)"
        ).fetchone()["n"]
    attempts = totals["c"] + totals["w"]
    accuracy = (totals["c"] / attempts * 100) if attempts else 0
    return {
        "players": players,
        "games": games,
        "average_score": round(avg),
        "highest_score": high,
        "accuracy": round(accuracy, 1),
        "average_duration": round(totals["d"] or 0, 1),
        "returning": returning,
    }


@app.get("/api/admin/series")
def series(x_admin_key: str | None = Header(default=None)):
    require_admin(x_admin_key)
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=offset)).isoformat() for offset in range(13, -1, -1)]
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT substr(played_at, 1, 10) AS day,
                   COUNT(*) AS games,
                   AVG(score) AS avg_score,
                   SUM(correct_answers) AS correct,
                   SUM(wrong_answers) AS wrong
            FROM games
            GROUP BY day
            """
        ).fetchall()
        scores = [row["score"] for row in conn.execute("SELECT score FROM games")]
        weekdays = conn.execute(
            """
            SELECT CAST(strftime('%w', played_at) AS INTEGER) AS weekday, COUNT(*) AS n
            FROM games GROUP BY weekday
            """
        ).fetchall()
    by_day = {row["day"]: row for row in rows}
    daily = []
    for day in days:
        row = by_day.get(day)
        correct = row["correct"] if row else 0
        wrong = row["wrong"] if row else 0
        attempts = (correct or 0) + (wrong or 0)
        daily.append({
            "day": day[5:],
            "games": row["games"] if row else 0,
            "avg_score": round(row["avg_score"]) if row and row["avg_score"] is not None else 0,
            "accuracy": round((correct / attempts) * 100, 1) if attempts else 0,
        })
    buckets = [0] * 6
    for score in scores:
        index = min(5, score // 1000)
        buckets[index] += 1
    names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    counts = {row["weekday"]: row["n"] for row in weekdays}
    return {
        "daily": daily,
        "scores": [{"label": f"{i}k" if i else "0", "count": buckets[i]} for i in range(6)],
        "weekdays": [{"label": names[i], "count": counts.get(i, 0)} for i in range(7)],
    }


init()
app.mount("/", StaticFiles(directory=ROOT, html=True), name="site")

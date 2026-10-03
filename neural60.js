(function () {
  const NAME_RE = /^[A-Za-z0-9_-]{1,16}$/;
  const ROUND_MS = 60000;
  const VERSION = "2.0";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ns = "http://www.w3.org/2000/svg";

  const TEMPLATES = [
    {
      id: "copper", tutorial: 1, tier: 0, layers: [1, 1, 1], need: 1, budget: 1, solution: [1],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: true, lock: false },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true }
      ]
    },
    {
      id: "bridge", tutorial: 2, tier: 0, layers: [1, 2, 1], need: 1, budget: 1, solution: [2],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: false, lock: false },
        { kind: "clear", a: [1, 1], b: [2, 0], on: false, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 0], on: false, lock: false }
      ]
    },
    {
      id: "poison", tier: 0, layers: [1, 3, 1], need: 1, budget: 1, solution: [1],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: false },
        { kind: "clear", a: [0, 0], b: [1, 2], on: true, lock: false },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "copper", a: [1, 1], b: [2, 0], on: true, lock: false },
        { kind: "clear", a: [1, 2], b: [2, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: false, lock: false }
      ]
    },
    {
      id: "decoy", tier: 0, layers: [1, 2, 1], need: 1, budget: 1, solution: [1],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: true, lock: false },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "copper", a: [1, 1], b: [2, 0], on: true, lock: false },
        { kind: "clear", a: [0, 0], b: [1, 1], on: false, lock: false }
      ]
    },
    {
      id: "upstream", tier: 3, layers: [1, 3, 1], need: 1, budget: 1, solution: [2],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: false },
        { kind: "copper", a: [1, 1], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 2], on: true, lock: false },
        { kind: "clear", a: [1, 2], b: [2, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: false, lock: false }
      ]
    },
    {
      id: "threshold", tier: 3, layers: [1, 3, 1], need: 2, budget: 2, solution: [2, 4],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 2], on: true, lock: false },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 0], on: false, lock: false },
        { kind: "copper", a: [1, 2], b: [2, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 1], on: false, lock: false }
      ]
    },
    {
      id: "dontfeed", tier: 4, layers: [1, 3, 1], need: 2, budget: 1, solution: [4],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 2], on: true, lock: false },
        { kind: "copper", a: [1, 2], b: [2, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: false, lock: false },
        { kind: "copper", a: [1, 2], b: [2, 0], on: false, lock: false }
      ]
    },
    {
      id: "double", tier: 4, layers: [1, 3, 1], need: 2, budget: 2, solution: [3, 4],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 0], on: false, lock: false },
        { kind: "clear", a: [0, 0], b: [1, 2], on: true, lock: false },
        { kind: "copper", a: [1, 2], b: [2, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: false, lock: false }
      ]
    },
    {
      id: "quiet", tier: 0, layers: [1, 2, 1], need: 1, budget: 1, solution: [3],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "copper", a: [1, 1], b: [2, 0], on: true, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 0], on: false, lock: false }
      ]
    },
    {
      id: "lane", tier: 0, layers: [1, 3, 1], need: 1, budget: 1, solution: [5],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "copper", a: [1, 1], b: [2, 0], on: false, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 2], on: true, lock: true },
        { kind: "copper", a: [1, 2], b: [2, 0], on: true, lock: false }
      ]
    },
    {
      id: "drift", tier: 0, layers: [1, 2, 1], need: 1, budget: 1, solution: [1],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: true, lock: false },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "copper", a: [1, 1], b: [2, 0], on: false, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 0], on: false, lock: false }
      ]
    },
    {
      id: "span", tier: 3, layers: [1, 2, 2, 1], need: 1, budget: 1, solution: [2],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "copper", a: [1, 0], b: [2, 0], on: true, lock: false },
        { kind: "clear", a: [2, 0], b: [3, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 1], on: false, lock: true },
        { kind: "copper", a: [2, 1], b: [3, 0], on: false, lock: true }
      ]
    },
    {
      id: "twin", tier: 3, layers: [1, 3, 1], need: 2, budget: 2, solution: [1, 3],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: false, lock: false },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 0], on: false, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 2], on: true, lock: true },
        { kind: "copper", a: [1, 2], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 2], on: false, lock: false }
      ]
    },
    {
      id: "relay", tier: 3, layers: [1, 2, 2, 1], need: 1, budget: 1, solution: [6],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [2, 0], b: [3, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 1], on: false, lock: true },
        { kind: "copper", a: [2, 1], b: [3, 0], on: false, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: true, lock: false }
      ]
    },
    {
      id: "choke", tier: 4, layers: [1, 2, 2, 1], need: 2, budget: 1, solution: [6],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 1], on: true, lock: true },
        { kind: "clear", a: [2, 0], b: [3, 0], on: true, lock: true },
        { kind: "clear", a: [2, 1], b: [3, 0], on: true, lock: true },
        { kind: "copper", a: [1, 0], b: [2, 0], on: true, lock: false },
        { kind: "copper", a: [2, 1], b: [3, 0], on: false, lock: false }
      ]
    },
    {
      id: "stack", tier: 4, layers: [1, 3, 1], need: 2, budget: 2, solution: [3, 4],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 0], on: false, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 0], on: true, lock: false },
        { kind: "copper", a: [1, 1], b: [2, 0], on: false, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 2], on: true, lock: true },
        { kind: "copper", a: [1, 2], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 2], on: false, lock: false }
      ]
    },
    {
      id: "rift", tier: 5, layers: [1, 3, 2, 1], need: 2, budget: 2, solution: [4, 6],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [2, 0], b: [3, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 1], on: false, lock: false },
        { kind: "clear", a: [2, 1], b: [3, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: true, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 2], on: true, lock: true },
        { kind: "copper", a: [1, 2], b: [2, 0], on: false, lock: true },
        { kind: "copper", a: [2, 0], b: [3, 0], on: false, lock: false }
      ]
    },
    {
      id: "knot", tier: 5, layers: [1, 2, 3, 1], need: 2, budget: 2, solution: [4, 6],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [2, 0], b: [3, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 1], on: false, lock: false },
        { kind: "clear", a: [2, 1], b: [3, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 0], on: true, lock: false },
        { kind: "copper", a: [1, 0], b: [2, 2], on: true, lock: true },
        { kind: "copper", a: [2, 2], b: [3, 0], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 2], on: false, lock: false },
        { kind: "copper", a: [2, 0], b: [3, 0], on: false, lock: false }
      ]
    },
    {
      id: "veil", tier: 5, layers: [1, 3, 2, 1], need: 2, budget: 1, solution: [8],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 1], on: true, lock: true },
        { kind: "clear", a: [2, 0], b: [3, 0], on: true, lock: true },
        { kind: "clear", a: [2, 1], b: [3, 0], on: true, lock: true },
        { kind: "copper", a: [0, 0], b: [1, 2], on: true, lock: true },
        { kind: "clear", a: [1, 2], b: [2, 0], on: false, lock: false },
        { kind: "copper", a: [1, 1], b: [2, 1], on: true, lock: false },
        { kind: "copper", a: [2, 0], b: [3, 0], on: false, lock: false }
      ]
    },
    {
      id: "crown", tier: 5, layers: [1, 3, 2, 1], need: 2, budget: 2, solution: [2, 6],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [2, 0], b: [3, 0], on: false, lock: false },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 1], on: true, lock: true },
        { kind: "clear", a: [2, 1], b: [3, 0], on: true, lock: true },
        { kind: "copper", a: [1, 1], b: [2, 1], on: true, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 2], on: true, lock: true },
        { kind: "copper", a: [1, 2], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [1, 2], b: [2, 1], on: false, lock: false },
        { kind: "copper", a: [2, 0], b: [3, 0], on: false, lock: false }
      ]
    },
    {
      id: "prism", tier: 5, layers: [1, 3, 3, 1], need: 2, budget: 2, solution: [5, 6],
      edges: [
        { kind: "clear", a: [0, 0], b: [1, 0], on: true, lock: true },
        { kind: "clear", a: [1, 0], b: [2, 0], on: true, lock: true },
        { kind: "clear", a: [2, 0], b: [3, 0], on: true, lock: true },
        { kind: "clear", a: [0, 0], b: [1, 1], on: true, lock: true },
        { kind: "clear", a: [1, 1], b: [2, 1], on: true, lock: true },
        { kind: "clear", a: [2, 1], b: [3, 0], on: false, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 0], on: true, lock: false },
        { kind: "copper", a: [0, 0], b: [1, 2], on: true, lock: true },
        { kind: "clear", a: [1, 2], b: [2, 2], on: false, lock: true },
        { kind: "copper", a: [2, 2], b: [3, 0], on: true, lock: true },
        { kind: "copper", a: [2, 0], b: [3, 0], on: false, lock: false }
      ]
    }
  ];

  const root = document.getElementById("neural");
  const gate = document.getElementById("neural-gate");
  const play = document.getElementById("neural-play");
  const end = document.getElementById("neural-end");
  const form = document.getElementById("neural-form");
  const nameInput = document.getElementById("neural-name");
  const nameError = document.getElementById("neural-name-error");
  const stage = document.getElementById("neural-stage");
  const svg = document.getElementById("neural-svg");
  const taskEl = document.getElementById("neural-task");
  const liveEl = document.getElementById("neural-live");
  const timeEl = document.getElementById("neural-time");
  const scoreEl = document.getElementById("neural-score");
  const comboEl = document.getElementById("neural-combo");
  const tierEl = document.getElementById("neural-tier");
  const tierMultEl = document.getElementById("neural-tier-mult");
  const levelEl = document.getElementById("neural-level");
  const levelMultEl = document.getElementById("neural-level-mult");
  const levelLabelEl = document.getElementById("neural-level-label");
  const fireBtn = document.getElementById("neural-fire");
  const heroBoard = document.getElementById("neural-hero-board");
  const endBoard = document.getElementById("neural-end-board");
  const openBtn = document.getElementById("neural-open");

  let username = "";
  let running = false;
  let raf = 0;
  let startedAt = 0;
  let score = 0;
  let streak = 0;
  let maxCombo = 0;
  let correct = 0;
  let wrong = 0;
  let shownSecond = 60;
  let challenge = null;
  let lock = false;
  let over = false;
  let dealt = 0;
  let seen = new Set();
  let shownTier = 1;
  let tierTimer = 0;
  let lastFocus = null;
  let roundToken = 0;
  let demoKey = "";
  let tourOpen = false;
  let tourSkipped = false;
  let tourWake = null;
  let tourTarget = null;
  let stepToken = 0;
  let tourJumped = false;
  const tourRoot = document.getElementById("neural-tour");
  const tourSpot = document.getElementById("neural-tour-spot");
  const tourCard = document.getElementById("neural-tour-card");
  const tourStep = document.getElementById("neural-tour-step");
  const tourText = document.getElementById("neural-tour-text");
  const tourNext = document.getElementById("neural-tour-next");
  const tourSkip = document.getElementById("neural-tour-skip");

  function t(key) {
    const lang = document.documentElement.lang === "fr" ? "fr" : "en";
    const pack = (window.copy && window.copy[lang]) || {};
    const en = (window.copy && window.copy.en) || {};
    return pack[key] != null ? pack[key] : en[key] || "";
  }

  function padScore(n) {
    const v = String(Math.max(0, n));
    return v.length >= 4 ? v : v.padStart(4, "0");
  }

  function fmtTime(ms) {
    const s = Math.min(60, Math.max(0, Math.ceil(ms / 1000)));
    return "00:" + String(s).padStart(2, "0");
  }

  function tierMult(elapsed) {
    if (elapsed >= 45000) return 5;
    if (elapsed >= 30000) return 4;
    if (elapsed >= 15000) return 3;
    return 1;
  }

  function wait(ms) {
    return new Promise((resolve) => { window.setTimeout(resolve, ms); });
  }

  function el(name, attrs) {
    const node = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function propagate(nodes, edges) {
    const on = {};
    nodes.forEach((node) => { if (node.layer === 0) on[node.id] = true; });
    const last = nodes.reduce((max, node) => Math.max(max, node.layer), 0);
    for (let layer = 1; layer <= last; layer += 1) {
      nodes.filter((node) => node.layer === layer).forEach((node) => {
        let clear = 0;
        let copper = 0;
        edges.forEach((edge) => {
          if (edge.b !== node.id || !edge.active || !on[edge.a]) return;
          if (edge.kind === "copper") copper += 1;
          else clear += 1;
        });
        on[node.id] = clear >= (node.need || 1) && copper === 0;
      });
    }
    return on;
  }

  function shuffle(count) {
    const order = [];
    for (let i = 0; i < count; i += 1) order.push(i);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = order[i];
      order[i] = order[j];
      order[j] = swap;
    }
    return order;
  }

  function materialize(template) {
    const perms = template.layers.map((count, layer) => {
      if (layer === 0 || layer === template.layers.length - 1) {
        const base = [];
        for (let i = 0; i < count; i += 1) base.push(i);
        return base;
      }
      return shuffle(count);
    });
    const nodes = [];
    template.layers.forEach((count, layer) => {
      for (let i = 0; i < count; i += 1) {
        nodes.push({
          id: nodes.length,
          layer,
          index: i,
          label: String(i + 1).padStart(2, "0"),
          need: layer === template.layers.length - 1 && i === 0 ? (template.need || 1) : 1
        });
      }
    });
    const idOf = (layer, index) => {
      const at = perms[layer][index];
      return nodes.find((node) => node.layer === layer && node.index === at).id;
    };
    const edges = template.edges.map((edge) => ({
      kind: edge.kind,
      a: idOf(edge.a[0], edge.a[1]),
      b: idOf(edge.b[0], edge.b[1]),
      active: edge.on,
      initial: edge.on,
      lock: !!edge.lock
    }));
    const byLayer = template.layers.map((_, layer) => nodes.filter((node) => node.layer === layer));
    return {
      id: template.id,
      tutorial: template.tutorial || 0,
      need: template.need || 1,
      budget: template.budget,
      solution: template.solution.slice(),
      nodes,
      edges,
      byLayer,
      targetId: byLayer[byLayer.length - 1][0].id
    };
  }

  function holds(model) {
    if (propagate(model.nodes, model.edges)[model.targetId]) return false;
    const edges = model.edges.map((edge) => Object.assign({}, edge));
    const open = model.solution.every((index) => edges[index] && !edges[index].lock);
    if (!open) return false;
    model.solution.forEach((index) => { edges[index].active = !edges[index].active; });
    return !!propagate(model.nodes, edges)[model.targetId];
  }

  function pick(mult, n) {
    if (n === 1) return TEMPLATES[0];
    if (n === 2 && mult < 3 && !seen.has(TEMPLATES[1].id)) return TEMPLATES[1];
    const minTier = mult < 3 ? 0 : mult;
    const unused = TEMPLATES.filter((item) => !item.tutorial && !seen.has(item.id) && item.tier >= minTier);
    const exact = unused.filter((item) => item.tier === minTier);
    const pool = exact.length ? exact : unused;
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spent() {
    return challenge.edges.filter((edge) => edge.active !== edge.initial).length;
  }

  function cutsLabel(left) {
    if (left === 1) return t("game.cut1");
    if (left === 0) return t("game.cut0");
    return t("game.cutn").replace("{n}", String(left));
  }

  function taskLine() {
    const cuts = cutsLabel(challenge.budget - spent());
    if (challenge.tutorial === 1) return t("game.demo.you") + " " + t("game.hint") + " · " + cuts;
    let line = t("game.goal");
    if (challenge.need > 1) line += " · " + t("game.need").replace("{n}", String(challenge.need));
    return line + " · " + cuts;
  }

  function edgeLabel(edge) {
    const kind = edge.kind === "copper" ? t("game.link.copper") : t("game.link.clear");
    if (edge.lock) return kind + ", " + t("game.link.locked");
    return kind + ", " + (edge.active ? t("game.link.on") : t("game.link.off"));
  }

  function announce(text) {
    taskEl.textContent = text;
    liveEl.textContent = text;
  }

  function popup(text, kind) {
    const node = document.createElement("p");
    node.className = "neural-pop" + (kind ? " is-" + kind : "");
    node.textContent = text;
    stage.appendChild(node);
    window.setTimeout(() => node.remove(), 700);
  }

  function setScore(next) {
    score = Math.max(0, next);
    scoreEl.textContent = padScore(score);
    scoreEl.classList.remove("is-tick");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("is-tick");
  }

  function setCombo() {
    const mult = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
    if (mult === 1) {
      comboEl.hidden = true;
      return;
    }
    comboEl.hidden = false;
    comboEl.textContent = t("game.combo").replace("{n}", String(mult));
  }

  function setTier(mult) {
    if (mult <= 1) {
      tierEl.hidden = true;
      return;
    }
    tierEl.hidden = false;
    tierMultEl.textContent = "×" + mult;
  }

  function showTierUp(mult) {
    levelMultEl.textContent = "×" + mult;
    levelLabelEl.textContent = t("game.tier.up");
    levelEl.hidden = false;
    window.clearTimeout(tierTimer);
    tierTimer = window.setTimeout(() => { levelEl.hidden = true; }, 1800);
  }

  function maybeMarkTier(elapsed) {
    const mult = tierMult(elapsed);
    if (mult === shownTier) return;
    shownTier = mult;
    setTier(mult);
    if (mult > 1) showTierUp(mult);
  }

  function layout(model, width, height) {
    const padX = 54;
    const padY = 42;
    const cols = model.byLayer.length;
    model.nodes.forEach((node) => {
      const count = model.byLayer[node.layer].length;
      const gap = Math.min(78, (height - padY * 2) / Math.max(1, count - 1 || 1));
      const block = gap * (count - 1);
      const y0 = (height - block) / 2;
      node.x = padX + ((node.layer + 0.5) * (width - padX * 2)) / cols;
      node.y = count === 1 ? height / 2 : y0 + node.index * gap;
    });
  }

  function bendsFor(edges) {
    const groups = {};
    edges.forEach((edge, index) => {
      const key = edge.a + ">" + edge.b;
      if (!groups[key]) groups[key] = [];
      groups[key].push(index);
    });
    const bend = {};
    Object.keys(groups).forEach((key) => {
      const indexes = groups[key];
      indexes.forEach((edgeIndex, order) => {
        if (indexes.length === 1) bend[edgeIndex] = 0;
        else bend[edgeIndex] = -36 + (72 * order) / (indexes.length - 1);
      });
    });
    return bend;
  }

  function curve(a, b, bend) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / len) * bend;
    const cy = my + (dx / len) * bend;
    return {
      d: "M " + a.x + " " + a.y + " Q " + cx + " " + cy + " " + b.x + " " + b.y,
      hx: 0.25 * a.x + 0.5 * cx + 0.25 * b.x,
      hy: 0.25 * a.y + 0.5 * cy + 0.25 * b.y
    };
  }

  function layerTitle(index, total) {
    if (index === 0) return "IN";
    if (index === total - 1) return "OUT";
    if (total === 3) return "H";
    return "H" + index;
  }

  function wireClass(edge, on, upTo) {
    const parts = ["wire", edge.kind === "copper" ? "is-copper" : "is-clear"];
    if (!edge.active) parts.push("is-idle");
    if (on && edge.active && on[edge.a] && challenge.nodes[edge.b].layer <= upTo) parts.push("is-live");
    return parts.join(" ");
  }

  function handleClass(edge) {
    const parts = ["handle", edge.kind === "copper" ? "is-copper" : "is-clear"];
    if (!edge.active) parts.push("is-idle");
    if (edge.lock) parts.push("is-locked");
    if (edge.active !== edge.initial) parts.push("is-edited");
    if (edge.demo) parts.push("is-demo");
    return parts.join(" ");
  }

  function draw(model) {
    const w = Math.max(280, stage.clientWidth);
    const h = Math.max(220, stage.clientHeight);
    layout(model, w, h);
    const bend = bendsFor(model.edges);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.replaceChildren();
    model.byLayer.forEach((layer, index) => {
      const label = el("text", { class: "layer-label", x: layer[0].x, y: 18 });
      label.textContent = layerTitle(index, model.byLayer.length);
      svg.appendChild(label);
    });
    model.edges.forEach((edge, index) => {
      const path = curve(model.nodes[edge.a], model.nodes[edge.b], bend[index]);
      const hit = el("path", { class: "edge-hit", d: path.d, "data-edge": index });
      const wire = el("path", { class: "wire", d: path.d });
      svg.appendChild(hit);
      svg.appendChild(wire);
      const handle = el("g", {
        class: "handle",
        role: "button",
        tabindex: edge.lock ? "-1" : "0",
        "data-edge": index,
        "aria-disabled": edge.lock ? "true" : "false"
      });
      handle.appendChild(el("circle", { class: "hit", cx: path.hx, cy: path.hy, r: edge.lock ? 8 : 12 }));
      handle.appendChild(el("circle", { class: "knob", cx: path.hx, cy: path.hy, r: edge.lock ? 4.5 : 6.5 }));
      svg.appendChild(handle);
      edge.hit = hit;
      edge.wire = wire;
      edge.handle = handle;
      edge.bend = bend[index];
    });
    model.nodes.forEach((node) => {
      const group = el("g", { class: "neuron", "aria-hidden": "true" });
      group.appendChild(el("circle", { class: "ring", cx: node.x, cy: node.y, r: 18 }));
      group.appendChild(el("circle", { class: "core", cx: node.x, cy: node.y, r: 12 }));
      const text = el("text", { x: node.x, y: node.y });
      text.textContent = node.label;
      group.appendChild(text);
      svg.appendChild(group);
      node.dom = group;
      if (node.need > 1) {
        const badge = el("text", { class: "need", x: node.x, y: node.y + 30 });
        badge.textContent = "×" + node.need;
        svg.appendChild(badge);
      }
    });
    const signal = el("circle", { class: "signal", r: reduce.matches ? 0 : 6, cx: 0, cy: 0 });
    signal.setAttribute("hidden", "");
    svg.appendChild(signal);
    model.signal = signal;
  }

  function paint(on, upTo) {
    if (!challenge) return;
    const reveal = !!on;
    challenge.nodes.forEach((node) => {
      const known = reveal ? node.layer <= upTo : node.layer === 0;
      const lit = known && (reveal ? !!on[node.id] : true);
      let dead = false;
      if (reveal && node.layer > 0 && node.layer <= upTo && !on[node.id]) {
        dead = challenge.edges.some((edge) => edge.b === node.id && edge.active && on[edge.a]);
      }
      node.dom.classList.toggle("is-hot", lit);
      node.dom.classList.toggle("is-target", node.id === challenge.targetId);
      node.dom.classList.toggle("is-dead", dead);
    });
    challenge.edges.forEach((edge) => {
      edge.wire.setAttribute("class", wireClass(edge, on, upTo));
      edge.hit.setAttribute("class", "edge-hit" + (edge.lock ? " is-locked" : ""));
      edge.handle.setAttribute("class", handleClass(edge));
      edge.handle.setAttribute("aria-label", edgeLabel(edge));
    });
  }

  function toggle(index) {
    if (!running || lock || over || !challenge) return;
    const edge = challenge.edges[index];
    if (!edge) return;
    if (edge.lock) {
      popup(t("game.locked"), "note");
      return;
    }
    const next = !edge.active;
    const returning = next === edge.initial;
    if (!returning && spent() >= challenge.budget) return;
    edge.active = next;
    paint(null, 0);
    announce(taskLine());
  }

  function nextChallenge(attempt) {
    if (!running) return;
    if (performance.now() - startedAt >= ROUND_MS) return;
    if ((attempt || 0) > 4) return;
    dealt += 1;
    const template = pick(tierMult(performance.now() - startedAt), dealt);
    if (!template) {
      dealt -= 1;
      return;
    }
    const model = materialize(template);
    if (!holds(model)) {
      dealt -= 1;
      nextChallenge((attempt || 0) + 1);
      return;
    }
    seen.add(template.id);
    challenge = model;
    challenge.shownAt = performance.now();
    draw(challenge);
    paint(null, 0);
    announce(taskLine());
    lock = false;
    fireBtn.disabled = false;
  }

  async function fire() {
    if (!running || lock || over || !challenge) return;
    lock = true;
    fireBtn.disabled = true;
    const fast = performance.now() - challenge.shownAt < (challenge.budget > 1 ? 8000 : 5000);
    const on = propagate(challenge.nodes, challenge.edges);
    const won = !!on[challenge.targetId];
    if (won) {
      streak += 1;
      maxCombo = Math.max(maxCombo, streak);
      correct += 1;
      const combo = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
      const pts = (100 + (fast ? 50 : 0)) * combo * tierMult(performance.now() - startedAt);
      setScore(score + pts);
      setCombo();
      popup("+" + pts);
      liveEl.textContent = "+" + pts;
    } else {
      wrong += 1;
      streak = 0;
      setScore(score - 50);
      setCombo();
      popup("-50", "bad");
      announce(t("game.dead"));
    }
    const step = reduce.matches ? 0 : 180;
    for (let layer = 0; layer < challenge.byLayer.length; layer += 1) {
      if (!running) return;
      paint(on, layer);
      if (step) await wait(step);
    }
    if (!running) return;
    await wait(reduce.matches ? 420 : 700);
    if (running) nextChallenge();
  }

  function frame(now) {
    if (!running) return;
    const left = Math.max(0, ROUND_MS - (now - startedAt));
    maybeMarkTier(now - startedAt);
    const second = Math.ceil(left / 1000);
    if (second !== shownSecond) {
      shownSecond = second;
      timeEl.textContent = fmtTime(left);
    }
    root.classList.toggle("is-urgent", second <= 10 && second > 0);
    if (left <= 0) {
      finish();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function show(screen) {
    gate.hidden = screen !== gate;
    play.hidden = screen !== play;
    end.hidden = screen !== end;
  }

  function openGate() {
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.style.overflow = "hidden";
    show(gate);
    nameError.textContent = "";
    try {
      const saved = localStorage.getItem("neural60-name");
      if (saved) nameInput.value = saved;
    } catch (e) { /* private mode */ }
    nameInput.focus();
  }

  function closeGame() {
    running = false;
    over = true;
    demoKey = "";
    tourSkipped = true;
    if (tourWake) tourWake();
    hideTour();
    cancelAnimationFrame(raf);
    window.clearTimeout(tierTimer);
    levelEl.hidden = true;
    fireBtn.classList.remove("is-demo");
    root.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function hideTour() {
    tourOpen = false;
    tourTarget = null;
    tourRoot.hidden = true;
  }

  function showTour() {
    tourOpen = true;
    tourRoot.hidden = false;
  }

  function placeSpot(target) {
    if (!target || !tourOpen) return;
    const host = play.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const pad = 10;
    const w = Math.max(box.width + pad * 2, 48);
    const h = Math.max(box.height + pad * 2, 48);
    const left = box.left - host.left - (w - box.width) / 2;
    const top = box.top - host.top - (h - box.height) / 2;
    tourSpot.style.left = left + "px";
    tourSpot.style.top = top + "px";
    tourSpot.style.width = w + "px";
    tourSpot.style.height = h + "px";
    const cardW = Math.min(300, host.width - 24);
    tourCard.style.width = cardW + "px";
    let cardLeft = Math.min(Math.max(8, left), host.width - cardW - 8);
    const cardH = tourCard.offsetHeight || 148;
    let cardTop = top + h + 12;
    if (h > host.height * 0.42) cardTop = host.height - cardH - 16;
    else if (cardTop + cardH > host.height - 8) cardTop = Math.max(8, top - cardH - 12);
    tourCard.style.left = cardLeft + "px";
    tourCard.style.top = cardTop + "px";
  }

  function delay(ms) {
    return new Promise((resolve) => { window.setTimeout(resolve, ms); });
  }

  function waitForNext() {
    return new Promise((resolve) => {
      tourWake = () => {
        tourWake = null;
        resolve();
      };
    });
  }

  function advanceTour() {
    stepToken += 1;
    tourJumped = true;
    if (tourWake) tourWake();
  }

  function skipTour() {
    tourSkipped = true;
    if (tourWake) tourWake();
  }

  function copperHandle() {
    if (!challenge) return null;
    const edge = challenge.edges[challenge.solution[0]];
    return edge ? edge.handle : null;
  }

  function outputNode() {
    if (!challenge) return null;
    const node = challenge.nodes.find((item) => item.id === challenge.targetId);
    return node ? node.dom : null;
  }

  function beginPlay() {
    if (!challenge) {
      challenge = materialize(TEMPLATES[0]);
      draw(challenge);
    }
    challenge.edges.forEach((edge) => {
      edge.active = edge.initial;
      edge.demo = false;
    });
    if (challenge.signal) challenge.signal.setAttribute("hidden", "");
    paint(null, 0);
    dealt = 1;
    seen = new Set([challenge.id]);
    shownTier = 1;
    setTier(1);
    levelEl.hidden = true;
    demoKey = "";
    hideTour();
    challenge.shownAt = performance.now();
    lock = false;
    fireBtn.disabled = false;
    fireBtn.classList.remove("is-demo");
    announce(taskLine());
    if (tourCard.contains(document.activeElement)) document.activeElement.blur();
    startedAt = performance.now();
    shownSecond = 60;
    timeEl.textContent = "00:60";
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function pointOnCurve(a, b, bend, t) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / len) * bend;
    const cy = my + (dx / len) * bend;
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
      y: u * u * a.y + 2 * u * t * cy + t * t * b.y
    };
  }

  function glide(edge, token) {
    const signal = challenge && challenge.signal;
    if (!signal || reduce.matches) return Promise.resolve();
    const from = challenge.nodes[edge.a];
    const to = challenge.nodes[edge.b];
    const stamp = stepToken;
    signal.removeAttribute("hidden");
    const started = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        if (!running || token !== roundToken || tourSkipped || stepToken !== stamp) {
          signal.setAttribute("hidden", "");
          resolve();
          return;
        }
        const u = Math.min(1, (now - started) / 720);
        const point = pointOnCurve(from, to, edge.bend || 0, u);
        signal.setAttribute("cx", point.x);
        signal.setAttribute("cy", point.y);
        if (u < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  async function animateClearPath(model, on, token) {
    const stamp = stepToken;
    const live = () => running && token === roundToken && !tourSkipped && stepToken === stamp;
    paint(on, 0);
    const hops = model.edges.filter((edge) => {
      return edge.active && edge.kind !== "copper" && on[edge.a] && on[edge.b];
    }).sort((a, b) => model.nodes[a.a].layer - model.nodes[b.a].layer);
    for (let index = 0; index < hops.length; index += 1) {
      if (!live()) return;
      const edge = hops[index];
      edge.wire.setAttribute("class", wireClass(edge, on, model.nodes[edge.b].layer));
      await glide(edge, token);
      if (!live()) return;
      paint(on, model.nodes[edge.b].layer);
    }
    if (model.signal) model.signal.setAttribute("hidden", "");
  }

  async function showTourStep(step, index, total) {
    tourJumped = false;
    demoKey = step.key;
    tourTarget = step.el;
    tourStep.textContent = (index + 1) + " / " + total;
    tourText.textContent = t(step.key);
    taskEl.textContent = "";
    if (step.enter) step.enter();
    placeSpot(step.el());
    if (!tourCard.contains(document.activeElement)) tourNext.focus();
    if (step.run) step.run();
    await waitForNext();
    if (step.leave) step.leave();
  }

  async function playTour(token) {
    const live = () => running && token === roundToken;
    const model = materialize(TEMPLATES[0]);
    challenge = model;
    draw(challenge);
    paint(null, 0);
    showTour();
    const steps = [
      { key: "game.tour.net", el: () => svg },
      { key: "game.tour.key", el: () => play.querySelector(".neural-key") },
      {
        key: "game.tour.link",
        el: copperHandle,
        run: async () => {
          const stamp = stepToken;
          model.solution.forEach((index) => { model.edges[index].demo = true; });
          paint(null, 0);
          placeSpot(copperHandle());
          await delay(reduce.matches ? 280 : 700);
          if (!running || token !== roundToken || tourSkipped || stepToken !== stamp) return;
          model.solution.forEach((index) => { model.edges[index].active = false; });
          paint(null, 0);
          placeSpot(copperHandle());
        }
      },
      {
        key: "game.tour.fire",
        el: () => fireBtn,
        enter: () => fireBtn.classList.add("is-demo"),
        leave: () => fireBtn.classList.remove("is-demo")
      },
      {
        key: "game.tour.out",
        el: () => stage,
        run: async () => {
          const stamp = stepToken;
          fireBtn.classList.remove("is-demo");
          const on = propagate(model.nodes, model.edges);
          await animateClearPath(model, on, token);
          if (!running || token !== roundToken || stepToken !== stamp) return;
          paint(on, model.byLayer.length);
          if (model.signal) model.signal.setAttribute("hidden", "");
          tourTarget = outputNode;
          placeSpot(outputNode());
        }
      },
      { key: "game.tour.time", el: () => timeEl.parentElement },
      { key: "game.tour.score", el: () => scoreEl.parentElement },
      {
        key: "game.tour.task",
        el: () => taskEl,
        enter: () => { taskEl.textContent = t("game.demo.you") + " " + t("game.hint"); }
      }
    ];
    for (let index = 0; index < steps.length; index += 1) {
      if (!live() || tourSkipped) break;
      await showTourStep(steps[index], index, steps.length);
    }
    if (token !== roundToken) return;
    if (!running) {
      hideTour();
      return;
    }
    beginPlay();
  }

  function startRound() {
    roundToken += 1;
    const token = roundToken;
    score = 0;
    streak = 0;
    maxCombo = 0;
    correct = 0;
    wrong = 0;
    shownSecond = 60;
    dealt = 0;
    seen = new Set();
    shownTier = 1;
    demoKey = "";
    tourSkipped = false;
    over = false;
    running = true;
    lock = true;
    setScore(0);
    setCombo();
    setTier(1);
    levelEl.hidden = true;
    timeEl.textContent = "00:60";
    root.classList.remove("is-urgent");
    fireBtn.disabled = true;
    fireBtn.classList.remove("is-demo");
    hideTour();
    show(play);
    cancelAnimationFrame(raf);
    requestAnimationFrame(() => {
      if (!running || token !== roundToken) return;
      playTour(token);
    });
  }

  function localGames() {
    try {
      const raw = JSON.parse(localStorage.getItem("neural60-games") || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function topThree(rows) {
    return [...rows].sort((a, b) => b.score - a.score || String(a.played_at).localeCompare(String(b.played_at))).slice(0, 3);
  }

  function renderList(list, ol, you) {
    ol.replaceChildren();
    if (!list.length) {
      const li = document.createElement("li");
      li.className = "is-empty";
      li.textContent = t("game.empty");
      ol.appendChild(li);
      return;
    }
    list.slice(0, 3).forEach((row, index) => {
      const li = document.createElement("li");
      if (you && row.username === you) li.classList.add("is-you");
      const rank = document.createElement("span");
      rank.textContent = String(index + 1).padStart(2, "0");
      const name = document.createElement("span");
      name.textContent = row.username;
      const value = document.createElement("span");
      value.textContent = String(row.score);
      li.append(rank, name, value);
      ol.appendChild(li);
    });
  }

  async function loadBoard() {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      renderList(data.top || [], heroBoard);
      return data.top || [];
    } catch (e) {
      const top = topThree(localGames());
      renderList(top, heroBoard);
      return top;
    }
  }

  async function saveGame() {
    const body = {
      username,
      score,
      duration: 60,
      correct_answers: correct,
      wrong_answers: wrong,
      max_combo: maxCombo,
      game_version: VERSION
    };
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      return { top: data.top || [], rank: data.rank, local: false };
    } catch (e) {
      const rows = localGames();
      const played = new Date().toISOString();
      rows.push({ username, score, played_at: played });
      try { localStorage.setItem("neural60-games", JSON.stringify(rows.slice(-40))); } catch (err) { /* full */ }
      const top = topThree(rows);
      const rankIndex = top.findIndex((row) => row.username === username && row.score === score && row.played_at === played);
      return { top, rank: rankIndex === -1 ? null : rankIndex + 1, local: true };
    }
  }

  async function finish() {
    if (over) return;
    over = true;
    running = false;
    cancelAnimationFrame(raf);
    timeEl.textContent = "00:00";
    lock = true;
    fireBtn.disabled = true;
    const result = await saveGame();
    document.getElementById("neural-final").textContent = padScore(score);
    document.getElementById("neural-nice").textContent = t("game.nice").replace("{name}", username);
    document.getElementById("neural-rank-note").textContent = result.rank ? t("game.made") : t("game.reach");
    const local = document.getElementById("neural-local");
    local.hidden = !result.local;
    if (result.local) local.textContent = t("game.local");
    renderList(result.top, endBoard, username);
    renderList(result.top, heroBoard);
    show(end);
    document.getElementById("neural-again").focus();
  }

  function validName(value) {
    const trimmed = value.trim();
    if (!trimmed) return { ok: false, message: t("game.name.empty") };
    if (!NAME_RE.test(trimmed)) return { ok: false, message: t("game.name.bad") };
    return { ok: true, name: trimmed };
  }

  function unlockedEdges() {
    if (!challenge) return [];
    return challenge.edges.map((edge, index) => (edge.lock ? -1 : index)).filter((index) => index >= 0);
  }

  openBtn.addEventListener("click", openGate);
  const scoresBtn = document.getElementById("neural-scores");
  const heroCta = document.querySelector(".hero-copy .neural-cta");
  if (scoresBtn && heroCta) {
    scoresBtn.addEventListener("click", () => {
      const open = heroCta.classList.toggle("is-open");
      scoresBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  root.querySelectorAll("[data-neural-close]").forEach((btn) => btn.addEventListener("click", closeGame));
  root.querySelector("[data-neural-exit]").addEventListener("click", closeGame);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const check = validName(nameInput.value);
    if (!check.ok) {
      nameError.textContent = check.message;
      nameInput.focus();
      return;
    }
    nameError.textContent = "";
    username = check.name;
    try { localStorage.setItem("neural60-name", username); } catch (e) { /* private mode */ }
    startRound();
  });
  document.getElementById("neural-again").addEventListener("click", startRound);
  fireBtn.addEventListener("click", () => { fire(); });

  svg.addEventListener("click", (event) => {
    const hit = event.target.closest("[data-edge]");
    if (hit) toggle(Number(hit.dataset.edge));
  });
  svg.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const hit = event.target.closest(".handle");
    if (!hit) return;
    event.preventDefault();
    toggle(Number(hit.dataset.edge));
  });
  document.addEventListener("keydown", (event) => {
    if (root.hidden || play.hidden || !challenge) return;
    if (event.target && event.target.matches && event.target.matches("input")) return;
    if (/^[1-9]$/.test(event.key)) {
      const pickIndex = unlockedEdges()[Number(event.key) - 1];
      if (pickIndex == null) return;
      event.preventDefault();
      toggle(pickIndex);
      return;
    }
    if (event.key !== "Enter") return;
    if (event.target && event.target.closest && event.target.closest("button, .handle")) return;
    event.preventDefault();
    fire();
  });
  tourNext.addEventListener("click", advanceTour);
  tourSkip.addEventListener("click", skipTour);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || root.hidden) return;
    if (tourOpen) {
      event.preventDefault();
      skipTour();
      return;
    }
    if (play.hidden) closeGame();
  });
  document.addEventListener("portfolio:lang", () => {
    loadBoard();
    if (tourOpen && demoKey) tourText.textContent = t(demoKey);
    else if (challenge && running && !lock) {
      announce(taskLine());
      paint(null, 0);
    }
    setCombo();
    setTier(shownTier);
    if (!levelEl.hidden) levelLabelEl.textContent = t("game.tier.up");
  });
  reduce.addEventListener("change", () => root.classList.toggle("is-calm", reduce.matches));
  root.classList.toggle("is-calm", reduce.matches);
  window.addEventListener("resize", () => {
    if (!challenge || !running) return;
    if (tourOpen) {
      draw(challenge);
      paint(null, 0);
      if (tourTarget) placeSpot(tourTarget());
      return;
    }
    if (!lock) {
      draw(challenge);
      paint(null, 0);
    }
  });

  loadBoard();
})();

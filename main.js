const nav = document.querySelector(".nav");
const hero = document.querySelector(".hero");
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector("#nav-links");

const observer = new IntersectionObserver(
  ([entry]) => nav.classList.toggle("is-solid", !entry.isIntersecting),
  { threshold: 0.08 }
);
observer.observe(hero);

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
});

links.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    links.classList.remove("is-open");
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

const buttons = [...document.querySelectorAll("[data-filter]")];
const cases = [...document.querySelectorAll(".case")];
const lanes = [...document.querySelectorAll(".lane")];
const empty = document.querySelector("#empty");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    buttons.forEach((item) => {
      const on = item === button;
      item.classList.toggle("is-on", on);
      item.setAttribute("aria-selected", String(on));
    });
    let shown = 0;
    cases.forEach((item) => {
      const hide = filter !== "all" && item.dataset.cat !== filter;
      item.hidden = hide;
      if (!hide) shown += 1;
    });
    lanes.forEach((lane) => {
      lane.hidden = ![...lane.querySelectorAll(".case")].some((item) => !item.hidden);
    });
    empty.hidden = shown !== 0;
  });
});

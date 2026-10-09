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
const projects = [...document.querySelectorAll(".project")];
const empty = document.querySelector("#empty");

document.querySelectorAll(".project-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const project = button.closest(".project");
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    const open = !project.classList.contains("is-open");
    project.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  });
});

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    buttons.forEach((item) => {
      const on = item === button;
      item.classList.toggle("is-on", on);
      item.setAttribute("aria-selected", String(on));
    });
    let shown = 0;
    projects.forEach((item) => {
      const hide = filter !== "all" && item.dataset.cat !== filter;
      item.hidden = hide;
      if (!hide) shown += 1;
    });
    empty.hidden = shown !== 0;
  });
});

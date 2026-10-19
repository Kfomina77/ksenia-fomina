// Ксения Фомина — портфолио. Её подпись и линии, кипение, мелкие взаимодействия.
import { SIGNATURE, LINES } from "./marks.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const BOIL_FPS = 8;
const NS = "http://www.w3.org/2000/svg";

// Стрелки рисуются линией со скруглёнными концами и сгибами.
// Обычная — для ссылок; изогнутая — у заголовка «Работы».
const ARROWS = {
  line: { viewBox: "0 0 64 24", d: "M3 12.5C20 11 40 13.4 58 12M47 4.5L59 12L47.5 19.5" },
  curve: { viewBox: "0 0 60 90", d: "M6 6C34 6 52 24 50 50C49 64 46 74 44 86M33 76L44 87L54 75" },
};

const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

// Шапка получает линию снизу, когда страница прокручена.
const top = document.querySelector(".top");
if (top) {
  const onScroll = () => top.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// ---------- Линии и стрелки ----------

const longest = Math.max(...LINES.map((l) => Number(l.viewBox.split(" ")[2])));

document.querySelectorAll("[data-line]").forEach((host) => {
  const line = LINES[Number(host.dataset.line)];
  const svg = svgEl("svg", { viewBox: line.viewBox, "aria-hidden": "true", focusable: "false" });
  if (host.dataset.stretch !== undefined) svg.setAttribute("preserveAspectRatio", "none");
  if (host.dataset.scale !== undefined) {
    svg.style.width = `${(Number(line.viewBox.split(" ")[2]) / longest) * 100}%`;
  }
  svg.append(svgEl("path", { d: line.d }));
  host.append(svg);
});

const renderArrows = (root) => {
  root.querySelectorAll("[data-arrow]").forEach((host) => {
    if (host.querySelector("svg")) return;
    const arrow = ARROWS[host.dataset.arrow] || ARROWS.line;
    const svg = svgEl("svg", { viewBox: arrow.viewBox, class: "arrow", "aria-hidden": "true", focusable: "false" });
    svg.append(svgEl("path", { d: arrow.d }));
    host.append(svg);
  });
};
renderArrows(document);

// Линия под заголовком кейса тянется ровно до конца самой длинной строки текста.
document.querySelectorAll(".case-hero__title").forEach((title) => {
  const line = title.querySelector(".case-hero__line");
  const text = [...title.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (!line || !text) return;
  const fit = () => {
    const range = document.createRange();
    range.selectNodeContents(text);
    const left = title.getBoundingClientRect().left;
    const right = Math.max(...[...range.getClientRects()].map((r) => r.right));
    line.style.width = `${Math.round((right - left) * 1.03)}px`;
  };
  fit();
  document.fonts?.ready.then(fit);
  new ResizeObserver(fit).observe(title);
});

// ---------- Подпись ----------

// Кадр «кипения»: весь контур смещается плавным полем. Соседние точки и оба края линии
// двигаются вместе, поэтому линия переступает на месте, а не мерцает по толщине.
const SIG_WIDTH = Number(SIGNATURE.viewBox.split(" ")[2]);
const variant = (d, seed, amp) => {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const p = Array.from({ length: 4 }, () => rand() * Math.PI * 2);
  const k = 0.035;
  const field = (x, y) => [
    (amp * (Math.sin(y * k + p[0]) + 0.6 * Math.sin(x * k * 0.7 + p[1]))) / 1.6,
    (amp * (Math.sin(x * k + p[2]) + 0.6 * Math.sin(y * k * 0.8 + p[3]))) / 1.6,
  ];
  return d.replace(/([MCL])([^MCLZ]+)/g, (m, op, nums) => {
    const v = nums.trim().split(/\s+/).map(Number);
    for (let i = 0; i < v.length; i += 2) {
      const [dx, dy] = field(v[i], v[i + 1]);
      v[i] += dx;
      v[i + 1] += dy;
    }
    return op + v.map((n) => n.toFixed(2)).join(" ");
  });
};

// Подпись видна сразу и кипит на месте.
document.querySelectorAll("[data-signature]").forEach((host, i) => {
  // Амплитуда задаётся в экранных пикселях и пересчитывается под размер подписи.
  const targetPx = Number(host.dataset.signature) || 2;
  const svg = svgEl("svg", { viewBox: SIGNATURE.viewBox, "aria-hidden": "true", focusable: "false" });
  const ink = svgEl("path", { d: SIGNATURE.d, class: "sig-ink" });
  svg.append(ink);
  host.append(svg);
  if (reduceMotion) return;

  let frames = [SIGNATURE.d];
  const buildFrames = () => {
    const amp = targetPx / Math.max(host.getBoundingClientRect().width / SIG_WIDTH, 0.01);
    frames = [variant(SIGNATURE.d, 11 + i, amp), variant(SIGNATURE.d, 37 + i, amp), variant(SIGNATURE.d, 73 + i, amp)];
  };
  buildFrames();
  new ResizeObserver(buildFrames).observe(host);
  let f = 0;
  setInterval(() => {
    f = (f + 1) % frames.length;
    ink.setAttribute("d", frames[f]);
  }, 1000 / BOIL_FPS);
});
// Рукописный кружок вокруг заголовка: двойной росчерк, кипит так же, как подпись.
const LOOP = {
  viewBox: "0 0 400 120",
  d: "M392 60L384 40C370 22 330 14 300 12L268 4C230 0 190 2 160 6L120 10C86 16 56 30 40 46L14 74L6 96C10 108 30 114 50 118L120 120C170 122 220 118 262 114L330 108C362 102 388 90 396 74L398 56C392 40 372 30 344 24L300 18C252 12 200 12 150 18L96 26C66 34 40 48 30 66L26 86C34 104 66 112 104 116L180 116C230 114 284 108 324 98L360 86C380 76 394 62 390 48M30 66L8 70L34 86",
};
document.querySelectorAll("[data-loop]").forEach((host, i) => {
  const targetPx = Number(host.dataset.loop) || 1.6;
  const svg = svgEl("svg", { viewBox: LOOP.viewBox, preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false" });
  const path = svgEl("path", { d: LOOP.d, "vector-effect": "non-scaling-stroke" });
  svg.append(path);
  host.append(svg);
  if (reduceMotion) return;
  let frames = [LOOP.d];
  const build = () => {
    const amp = targetPx / Math.max(host.getBoundingClientRect().width / 400, 0.01);
    frames = [variant(LOOP.d, 5 + i, amp), variant(LOOP.d, 29 + i, amp), variant(LOOP.d, 61 + i, amp)];
  };
  build();
  new ResizeObserver(build).observe(host);
  let f = 0;
  setInterval(() => {
    f = (f + 1) % frames.length;
    path.setAttribute("d", frames[f]);
  }, 1000 / BOIL_FPS);
});

// «Что я делаю» и «Инструменты» начинаются на уровне последней строки текста о себе.
const about = document.querySelector(".about");
const lead = about && about.querySelector(".about__lead");
if (about && lead) {
  const alignCols = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      about.style.removeProperty("--lead-last");
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(lead);
    const rects = [...range.getClientRects()];
    if (!rects.length) return;
    const lastTop = Math.max(...rects.map((r) => r.top));
    about.style.setProperty("--lead-last", `${Math.max(0, Math.round(lastTop - about.getBoundingClientRect().top))}px`);
  };
  // высота фото = высоте текстового блока рядом: от первой строки до строки с фактами
  const intro = about.querySelector(".about__intro");
  const fitPhoto = () => {
    if (intro) about.style.setProperty("--photo-h", `${Math.round(intro.offsetHeight)}px`);
  };
  // подпись: от левого края блока до фото, заходит на фото примерно на четверть его ширины
  const portrait = about.querySelector(".about__portrait");
  const photo = about.querySelector(".about__photo");
  const fitSig = () => {
    if (!portrait || !photo) return;
    const box = portrait.getBoundingClientRect();
    const p = photo.getBoundingClientRect();
    const edge = about.getBoundingClientRect().left;
    const width = p.left - edge + p.width * 0.28;
    const height = width * (157.19 / 272.07);
    portrait.style.setProperty("--sig-left", `${Math.round(edge - box.left)}px`);
    portrait.style.setProperty("--sig-w", `${Math.round(width)}px`);
    portrait.style.setProperty("--sig-top", `${Math.round(p.height / 2 - height / 2)}px`);
  };
  const fitAll = () => {
    fitPhoto();
    alignCols();
    fitSig();
  };
  fitAll();
  document.fonts?.ready.then(fitAll);
  new ResizeObserver(fitAll).observe(about);
}

// ---------- Превью работы у курсора ----------

const peek = document.querySelector(".peek");
const peekPlate = peek && peek.querySelector(".plate");
if (peek && window.matchMedia("(hover: hover)").matches) {
  let x = 0, y = 0, px = 0, py = 0, raf = 0;
  const loop = () => {
    px += (x - px) * 0.18;
    py += (y - py) * 0.18;
    peek.style.transform = `translate3d(${px + 24}px, ${py - 120}px, 0) rotate(-2deg)`;
    raf = Math.abs(x - px) + Math.abs(y - py) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  document.querySelectorAll(".index__item a").forEach((link) => {
    link.addEventListener("mouseenter", (e) => {
      const src = link.dataset.peekSrc;
      peekPlate.dataset.label = src ? "" : link.dataset.peek || "";
      peekPlate.classList.toggle("plate--empty", !src);
      peekPlate.style.backgroundImage = src ? `url("${src}")` : "";
      peekPlate.style.setProperty("--ratio", link.dataset.ratio || "4 / 3");
      x = px = e.clientX;
      y = py = e.clientY;
      peek.classList.add("is-on");
      loop();
    });
    link.addEventListener("mousemove", (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    link.addEventListener("mouseleave", () => peek.classList.remove("is-on"));
  });
}

// ---------- Работы: превью сжимаются в точки, и сразу открывается кейс ----------

const works = document.querySelector(".works");
if (works) {
  const SHRINK_MS = reduceMotion ? 0 : 760;

  // точка в 9px независимо от размера превью
  const setDotScale = () => {
    const thumb = works.querySelector(".entry__thumb");
    if (thumb) works.style.setProperty("--dot-scale", (9 / thumb.offsetWidth).toFixed(3));
  };
  setDotScale();
  window.addEventListener("resize", setDotScale);

  works.querySelectorAll("a[data-transition]").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      works.classList.add("is-open");
      setTimeout(() => { window.location.href = link.href; }, SHRINK_MS);
    });
  });

  // возврат кнопкой «Назад»: точки снова вырастают в превью
  window.addEventListener("pageshow", () => {
    if (works.classList.contains("is-open")) requestAnimationFrame(() => works.classList.remove("is-open"));
  });
}

// ---------- Слайдер разворотов брендбука ----------

document.querySelectorAll("[data-book]").forEach((book) => {
  const track = book.querySelector(".book__track");
  const pages = track.children;
  const count = book.querySelector(".book__count");
  const [prev, next] = book.querySelectorAll(".book__btn");
  const pad = (n) => String(n).padStart(2, "0");
  const current = () => Math.round(track.scrollLeft / track.clientWidth);
  const update = () => {
    const i = current();
    count.textContent = `${pad(i + 1)} / ${pad(pages.length)}`;
    prev.disabled = i === 0;
    next.disabled = i === pages.length - 1;
  };
  const go = (dir) => track.scrollTo({ left: (current() + dir) * track.clientWidth });
  book.querySelectorAll(".book__btn").forEach((btn) => btn.addEventListener("click", () => go(Number(btn.dataset.dir))));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  track.addEventListener("scroll", update, { passive: true });
  update();
});

// ---------- Копирование почты ----------

document.querySelectorAll(".copy[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.dataset.state = "done";
      setTimeout(() => delete btn.dataset.state, 2200);
    } catch {
      window.location.href = `mailto:${btn.dataset.copy}`;
    }
  });
});
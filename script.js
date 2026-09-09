// Kick off the entrance animations once fonts/layout are ready.
requestAnimationFrame(() => {
  document.body.classList.add("ready");
});

// ---------- custom cursor ----------
const cursor = document.getElementById("cursor");
const cursorLabel = cursor.querySelector(".cursor-label");
let mouseX = 0,
  mouseY = 0,
  curX = 0,
  curY = 0;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function tick() {
  curX += (mouseX - curX) * 0.25;
  curY += (mouseY - curY) * 0.25;
  cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
  requestAnimationFrame(tick);
}
tick();

document.querySelectorAll(".hoverable").forEach((el) => {
  const label = el.dataset.label || "";

  el.addEventListener("mouseenter", () => {
    if (label) {
      cursor.classList.add("label-mode");
      cursor.classList.remove("enlarge");
      cursorLabel.textContent = label;
    } else {
      cursor.classList.add("enlarge");
    }
  });

  el.addEventListener("mouseleave", () => {
    cursor.classList.remove("enlarge", "label-mode");
    cursorLabel.textContent = "";
  });
});

// ---------- scroll fill ----------
const fill = document.getElementById("scrollFill");

function updateScrollFill() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  fill.style.height = `${progress * 100}%`;
}

// ---------- timeline (pinned horizontal scroll) ----------
const timelineWrap = document.getElementById("experiences");
const timelineTrack = document.getElementById("timelineTrack");
const timelineDots = document.querySelectorAll(".dot");
const stepContents = document.querySelectorAll(".step-content");
const STEP_COUNT = stepContents.length;

function updateTimeline() {
  const pinHeight = timelineWrap.offsetHeight - window.innerHeight;
  const wrapTop = timelineWrap.offsetTop;
  let progress = pinHeight > 0 ? (window.scrollY - wrapTop) / pinHeight : 0;
  progress = Math.min(Math.max(progress, 0), 1);

  // track width is 300% of its container, so 66.667% of ITS width == 2x container width
  timelineTrack.style.transform = `translateX(-${progress * (200 / 3)}%)`;

  const continuousIndex = progress * (STEP_COUNT - 1);
  const activeIndex = Math.round(continuousIndex);

  stepContents.forEach((el, i) => {
    const closeness = 1 - Math.min(Math.abs(continuousIndex - i), 1);
    el.style.opacity = closeness;
    el.style.transform = `translateY(${(1 - closeness) * 32}px)`;
  });

  timelineDots.forEach((dot, i) => {
    dot.classList.toggle("active", i === activeIndex);
  });
}

// ---------- hybrid visual (pinned, scroll-scrubbed columns -> morph) ----------
const advantageWrap = document.getElementById("advantage");
const advantageColumns = document.getElementById("advantageColumns");
const colLeft = document.getElementById("colLeft");
const colRight = document.getElementById("colRight");
const advantageMorph = document.getElementById("advantageMorph");
const advBefore = document.getElementById("advBefore");
const advAfter = document.getElementById("advAfter");

function wrapLettersPlain(el) {
  const text = el.textContent;
  el.textContent = "";
  [...text].forEach((ch) => {
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = ch === " " ? " " : ch;
    el.appendChild(span);
  });
  return el.querySelectorAll(".letter");
}

const advBeforeLetters = wrapLettersPlain(advBefore);
const advAfterLetters = wrapLettersPlain(advAfter);

function updateAdvantage() {
  const pinHeight = advantageWrap.offsetHeight - window.innerHeight;
  const wrapTop = advantageWrap.offsetTop;
  let progress = pinHeight > 0 ? (window.scrollY - wrapTop) / pinHeight : 0;
  progress = Math.min(Math.max(progress, 0), 1);

  const convergeProgress = Math.min(progress / 0.45, 1);
  const shiftDistance = advantageColumns.offsetWidth * 0.22;
  colLeft.style.transform = `translateX(${convergeProgress * shiftDistance}px)`;
  colRight.style.transform = `translateX(${-convergeProgress * shiftDistance}px)`;

  const listOpacity = 1 - Math.min(convergeProgress / 0.8, 1);
  document.querySelectorAll(".advantage-list").forEach((l) => {
    l.style.opacity = listOpacity;
  });

  const columnsOpacity = 1 - Math.min(Math.max((progress - 0.42) / 0.13, 0), 1);
  advantageColumns.style.opacity = columnsOpacity;

  const morphOpacity = Math.min(Math.max((progress - 0.42) / 0.13, 0), 1);
  advantageMorph.style.opacity = morphOpacity;

  const morphProgress = Math.min(Math.max((progress - 0.6) / 0.4, 0), 1);

  advBeforeLetters.forEach((el, i) => {
    const t = Math.min(Math.max(morphProgress * advBeforeLetters.length - i, 0), 1);
    el.style.opacity = 1 - t;
    el.style.transform = `translateY(${-t * 20}px)`;
  });

  advAfterLetters.forEach((el, i) => {
    const t = Math.min(Math.max(morphProgress * advAfterLetters.length - i, 0), 1);
    el.style.opacity = t;
    el.style.transform = `translateY(${(1 - t) * 20}px)`;
  });
}

// ---------- unified scroll loop ----------
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateScrollFill();
    updateTimeline();
    updateAdvantage();
    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

// ---------- word-by-word headline reveals ----------
document.querySelectorAll(".word-reveal, .descend-reveal").forEach((headline) => {
  const baseOffset = parseFloat(headline.dataset.delayOffset || 0);
  headline.querySelectorAll(".word").forEach((word, i) => {
    word.style.transitionDelay = `${baseOffset + i * 0.06}s`;
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);

document
  .querySelectorAll(".word-reveal, .descend-reveal, .plot-p, .reveal-fade-io, .steps-list, .duo-row")
  .forEach((el) => revealObserver.observe(el));

const playObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("play");
        playObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

document
  .querySelectorAll("#plotTransition, #shiftBlock")
  .forEach((el) => playObserver.observe(el));

// ---------- letter-split for the morph effect ----------
function wrapLetters(el, baseDelay = 0) {
  const text = el.textContent;
  el.textContent = "";
  [...text].forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = ch === " " ? " " : ch;
    span.style.transitionDelay = `${baseDelay + i * 0.02}s`;
    el.appendChild(span);
  });
}

wrapLetters(document.getElementById("morphBefore"), 0);
wrapLetters(document.getElementById("morphAfter"), 0.5);

// ---------- click-item micro-animations ----------
const clickItemObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        clickItemObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll(".click-item").forEach((el) => clickItemObserver.observe(el));

// ---------- skills nav: cursor-following detail label ----------
const skillsNav = document.getElementById("skillsNav");
const skillFollower = document.getElementById("skillFollower");
const skillRows = document.querySelectorAll(".skill-row");

let skillTargetX = 0,
  skillTargetY = 0,
  skillFollowerX = 0,
  skillFollowerY = 0;

skillsNav.addEventListener("mousemove", (e) => {
  const rect = skillsNav.getBoundingClientRect();
  skillTargetX = e.clientX - rect.left;
  skillTargetY = e.clientY - rect.top;
});

function tickSkillFollower() {
  skillFollowerX += (skillTargetX - skillFollowerX) * 0.2;
  skillFollowerY += (skillTargetY - skillFollowerY) * 0.2;
  skillFollower.style.transform = `translate(${skillFollowerX}px, ${skillFollowerY}px) translate(24px, -50%)`;
  requestAnimationFrame(tickSkillFollower);
}
tickSkillFollower();

skillRows.forEach((row) => {
  row.addEventListener("mouseenter", () => {
    skillFollower.textContent = row.dataset.detail;
    skillFollower.classList.add("visible");
    skillRows.forEach((r) => r.classList.toggle("dim", r !== row));
  });

  row.addEventListener("mouseleave", () => {
    skillFollower.classList.remove("visible");
  });
});

skillsNav.addEventListener("mouseleave", () => {
  skillRows.forEach((r) => r.classList.remove("dim"));
});

// ---------- text scramble ("letters move like code") ----------
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = "01_/><{}[]#$%&*ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }

  setText(newText) {
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);
    const queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20) + 20;
      queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.update(queue);
    });
  }

  update(queue) {
    let output = "";
    let complete = 0;
    for (let i = 0; i < queue.length; i++) {
      const entry = queue[i];
      const { from, to, start, end } = entry;
      let char = entry.char;
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          entry.char = char;
        }
        output += char;
      } else {
        output += from;
      }
    }
    this.el.textContent = output;
    if (complete === queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(() => {
        this.frame++;
        this.update(queue);
      });
    }
  }
}

const codeReveal = document.getElementById("codeReveal");
const scrambler = new TextScramble(codeReveal);
const codeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        scrambler.setText("WEB DEVELOPMENT");
        codeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);
codeObserver.observe(codeReveal);

document
  .querySelectorAll(".qualities-grid")
  .forEach((el) => revealObserver.observe(el));

document
  .querySelectorAll(".loop-pair")
  .forEach((el) => playObserver.observe(el));

// ---------- positioning: split-text duo reveal ----------
document.querySelectorAll(".duo-text").forEach((el) => {
  const letters = wrapLettersPlain(el);
  letters.forEach((letter, i) => {
    letter.style.transitionDelay = `${i * 0.035}s`;
  });
});

// ---------- final: magnetic CTA ----------
const magneticBtn = document.getElementById("magneticBtn");

magneticBtn.addEventListener("mousemove", (e) => {
  const rect = magneticBtn.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  magneticBtn.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
});

magneticBtn.addEventListener("mouseleave", () => {
  magneticBtn.style.transform = "translate(0, 0)";
});

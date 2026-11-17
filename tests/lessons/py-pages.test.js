import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, it, expect, afterEach } from "vitest";
import { loadPage, loadScript, closePages } from "../helpers/load-script.js";

afterEach(closePages);

const LESSONS = [
  { folder: "18-py-types", num: 18, topic: "types", tabs: ["theory", "customs", "predict", "quiz-tab", "final"] },
  { folder: "19-py-branching", num: 19, topic: "branching", tabs: ["theory", "trace", "truth", "quiz-tab", "final"] },
  { folder: "20-py-branch-tester", num: 20, topic: "branching", tabs: ["brief", "hunt", "fix", "final"] },
  { folder: "21-py-list-slices", num: 21, topic: "slices", tabs: ["theory", "train", "predict", "quiz-tab", "final"] },
  { folder: "22-py-slice-precise", num: 22, topic: "slices", tabs: ["warmup", "precise", "final"] },
  { folder: "23-py-list-ops", num: 23, topic: "list-ops", tabs: ["theory", "predict", "alias", "quiz-tab", "final"] },
  { folder: "24-py-list-methods", num: 24, topic: "list-ops", tabs: ["theory", "robot", "quiz-tab", "final"] },
  { folder: "25-py-for-range", num: 25, topic: "for-range", tabs: ["theory", "counter", "predict", "trace", "quiz-tab", "final"] }
];

describe("уроки курсу «Інформатика, поглиблений рівень»: спільна структура", () => {
  for (const L of LESSONS) {
    it("урок " + L.num + ": вкладки, шапка, посилання, бали, без Python", async () => {
      const window = await loadPage(L.folder);
      const doc = window.document;
      const tabs = [...doc.querySelectorAll("nav.tabs button[data-tab]")];
      expect(tabs.map(b => b.dataset.tab)).toEqual(L.tabs);
      for (const b of tabs) {
        expect(doc.querySelector("section.panel#" + b.dataset.tab), b.dataset.tab).not.toBeNull();
      }
      expect(doc.querySelector(".hero small").textContent).toContain("Заняття " + L.num + " · Інформатика, поглиблений рівень");
      expect(doc.querySelector("a.back").getAttribute("href")).toBe("../../index.html#inf10deep");
      expect(doc.querySelector('#final a[href="../../taskbook/index.html#' + L.topic + '"]')).not.toBeNull();
      expect(Number(doc.querySelector("[data-max]").textContent)).toBeGreaterThanOrEqual(10);
      expect(doc.querySelector("style").textContent.trim().startsWith("/* Ідея:")).toBe(true);
      expect(doc.querySelector("style").textContent).toContain("--accent:var(--sky)");
      const hrefs = [...doc.querySelectorAll("footer a")].map(a => a.getAttribute("href"));
      expect(hrefs).toContain("teacher.html");
    });
  }
});

describe("урок 18 · Митниця типів", () => {
  it("ставить штамп, показує значення й «чому», «Не знаю» дає 0", async () => {
    const window = await loadPage("18-py-types");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const first = doc.querySelector("#customs .cust-card");
    expect(first.textContent).toContain('"3" + 4');
    first.querySelector('button[data-stamp="Помилка"]').click();
    expect(score()).toBe(1);
    expect(first.querySelector(".why").textContent).toContain("TypeError");
    const second = doc.querySelectorAll("#customs .cust-card")[1];
    second.querySelector('button[data-stamp="int"]').click();
    expect(score()).toBe(1);
    expect(second.textContent).toContain("3.5");
    const third = doc.querySelectorAll("#customs .cust-card")[2];
    third.querySelector("button[data-unknown]").click();
    expect(score()).toBe(1);
    expect(third.querySelector(".why").textContent.length).toBeGreaterThan(10);
  });
  it("містить пастки -7 // 2, round(2.5), int(\"3.5\") зі значеннями CPython", async () => {
    const doc = (await loadPage("18-py-types")).document;
    doc.querySelectorAll("#customs button[data-unknown]").forEach(b => b.click());
    const text = doc.querySelector("#customs").textContent;
    expect(text).toContain("-7 // 2");
    expect(text).toContain("round(2.5)");
    expect(text).toContain('int("3.5")');
    expect(text).toContain("-4");
  });
  it("«Перевірити запуском» не падає без Worker і бал дає передбачення", async () => {
    const window = await loadPage("18-py-types");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const item = doc.querySelector("#predict .pred-item");
    const run = item.querySelector("button[data-run]");
    if (run) run.click();
    expect(score()).toBe(0);
    item.querySelector("button[data-opt]").click();
    expect(score() <= 1).toBe(true);
    expect(item.querySelector(".why").textContent.length).toBeGreaterThan(5);
  });
});

describe("урок 19 · Диспетчерська розвилок", () => {
  it("трасування: вибір рядка, підсвітка шляху, пастка з порядком elif", async () => {
    const window = await loadPage("19-py-branching");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const items = [...doc.querySelectorAll("#trace .trace-item")];
    expect(items.length).toBeGreaterThanOrEqual(6);
    const trap = items.find(i => /elif grade >= 10/.test(i.textContent) && /grade >= 7/.test(i.textContent));
    expect(trap, "елемент з неправильним порядком elif").toBeDefined();
    const correct = trap.querySelector('button[data-opt][data-right="1"]');
    expect(correct.textContent).toContain("Достатній");
    correct.click();
    expect(score()).toBe(1);
    expect(trap.querySelectorAll(".ln.ran").length).toBeGreaterThan(0);
    expect(trap.querySelector(".why").textContent).toContain("elif");
    const other = items[1];
    other.querySelector("button[data-opt]:not([data-right])").click();
    expect(score()).toBe(1);
  });
  it("таблиця істинності: перевірка зараховує правильні клітинки", async () => {
    const window = await loadPage("19-py-branching");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const cells = [...doc.querySelectorAll("#truth button[data-cell]")];
    expect(cells.length).toBe(10);
    const before = score();
    for (const c of cells) {
      const want = c.dataset.answer;
      for (let i = 0; i < 3 && c.textContent.trim() !== want; i++) c.click();
      expect(c.textContent.trim()).toBe(want);
    }
    doc.querySelector("#truth button[data-check]").click();
    expect(score()).toBe(before + 10);
  });
  it("вікторина має питання про = і ==", async () => {
    const doc = (await loadPage("19-py-branching")).document;
    expect(doc.querySelector("#quiz-tab").textContent).toContain("==");
  });
});

describe("урок 20 · Тестувальник", () => {
  const setVal = (window, input, v) => { input.value = String(v); input.dispatchEvent(new window.Event("input", { bubbles: true })); };
  it("hunt: стільки карток, скільки програм; бал за зламний вхід лише раз", async () => {
    const window = await loadPage("20-py-branch-tester");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const cards = [...doc.querySelectorAll("#hunt .hunt-card")];
    expect(cards.length).toBe(window.Py.tester.PROGRAMS.length);
    const leap = cards.find(c => c.dataset.id === "leap");
    expect(leap.querySelector("pre").textContent).toContain("year % 100");
    const before = score();
    setVal(window, leap.querySelector('input[data-var="year"]'), 2024);
    leap.querySelector("button[data-run]").click();
    expect(leap.querySelector(".out-buggy").textContent).toContain("Високосний");
    expect(score()).toBe(before);
    expect(leap.querySelector(".why").textContent.trim()).toBe("");
    setVal(window, leap.querySelector('input[data-var="year"]'), 2000);
    leap.querySelector("button[data-run]").click();
    expect(leap.querySelector(".out-buggy").textContent).toContain("Звичайний");
    expect(leap.querySelector(".out-correct").textContent).toContain("Високосний");
    expect(score()).toBe(before + 1);
    expect(leap.querySelector(".why").textContent).toContain("400");
    expect(leap.querySelectorAll("pre .ln.bug").length).toBe(1);
    leap.querySelector("button[data-run]").click();
    expect(score()).toBe(before + 1);
  });
  it("hunt: булеве поле й «Здаюся» без балів", async () => {
    const window = await loadPage("20-py-branch-tester");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const disc = doc.querySelector('#hunt .hunt-card[data-id="discount"]');
    setVal(window, disc.querySelector('input[data-var="age"]'), 70);
    disc.querySelector('button[data-val="false"]').click();
    disc.querySelector("button[data-run]").click();
    expect(score()).toBe(1);
    const fizz = doc.querySelector('#hunt .hunt-card[data-id="fizzbuzz"]');
    fizz.querySelector("button[data-giveup]").click();
    expect(score()).toBe(1);
    expect(fizz.querySelector(".why").textContent).toContain("15");
    expect(fizz.querySelector(".out-buggy").textContent).toContain("Fizz");
  });
  it("fix: правильний рядок дає бал, «чому» показано для всіх варіантів", async () => {
    const doc = (await loadPage("20-py-branch-tester")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const card = doc.querySelector('#fix .fix-card[data-id="fizzbuzz"]');
    expect(card.querySelectorAll("button.fix-opt").length).toBe(3);
    card.querySelector('button.fix-opt[data-ok="0"]').click();
    expect(score()).toBe(0);
    expect(card.querySelectorAll(".opt-why").length).toBe(3);
    const c2 = doc.querySelector('#fix .fix-card[data-id="leap"]');
    c2.querySelector('button.fix-opt[data-ok="1"]').click();
    expect(score()).toBe(1);
  });
});

describe("урок 21 · Потяг-список", () => {
  const setR = (window, input, v) => { input.value = String(v); input.dispatchEvent(new window.Event("input", { bubbles: true })); };
  it("train: три повзунки, вираз, підсвічені вагони, ValueError для кроку 0", async () => {
    const window = await loadPage("21-py-list-slices");
    const doc = window.document;
    const r = [...doc.querySelectorAll("#train input[type=range]")];
    expect(r.length).toBe(3);
    expect(doc.querySelectorAll("#train .wagon").length).toBe(6);
    const none = n => doc.querySelector('#train input[data-none="' + n + '"]');
    none("start").checked = false; none("start").dispatchEvent(new window.Event("change", { bubbles: true }));
    none("stop").checked = false; none("stop").dispatchEvent(new window.Event("change", { bubbles: true }));
    setR(window, doc.querySelector('#train input[data-r="start"]'), 1);
    setR(window, doc.querySelector('#train input[data-r="stop"]'), 4);
    expect(doc.querySelector("#train .expr").textContent).toContain("a[1:4]");
    expect(doc.querySelector("#train .result").textContent).toContain("['пошта', 'купе', 'плацкарт']");
    expect(doc.querySelectorAll("#train .wagon.on").length).toBe(3);
    none("start").checked = true; none("start").dispatchEvent(new window.Event("change", { bubbles: true }));
    none("stop").checked = true; none("stop").dispatchEvent(new window.Event("change", { bubbles: true }));
    none("step").checked = false; none("step").dispatchEvent(new window.Event("change", { bubbles: true }));
    setR(window, doc.querySelector('#train input[data-r="step"]'), -1);
    expect(doc.querySelector("#train .expr").textContent).toContain("a[::-1]");
    expect(doc.querySelectorAll("#train .wagon.on").length).toBe(6);
    expect(doc.querySelector("#train .result").textContent).toMatch(/^[^]*\['вантаж'[^]*'локомотив'\]/);
    setR(window, doc.querySelector('#train input[data-r="step"]'), 0);
    expect(doc.querySelector("#train .result").textContent).toContain("ValueError");
    expect(doc.querySelectorAll("#train .wagon.on").length).toBe(0);
  });
  it("predict: a[10] → IndexError, a[2:10] без помилки, «Не знаю» = 0", async () => {
    const doc = (await loadPage("21-py-list-slices")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const items = [...doc.querySelectorAll("#predict .pred-item")];
    expect(items.length).toBe(7);
    const by = t => items.find(i => i.querySelector(".pred-code").textContent.trim() === t);
    const idx = by("a[10]");
    expect(idx.querySelector("button[data-right]").textContent).toContain("IndexError");
    idx.querySelector("button[data-right]").click();
    expect(score()).toBe(1);
    expect(idx.querySelector(".why").textContent).toContain("IndexError");
    const sl = by("a[2:10]");
    expect(sl.querySelector("button[data-right]").textContent).not.toContain("Error");
    sl.querySelector("button[data-unknown]").click();
    expect(score()).toBe(1);
    expect(sl.querySelector(".why").textContent).toContain("без помилки");
    const rev = by("a[::-1]");
    rev.querySelector("button[data-opt]:not([data-right])").click();
    expect(score()).toBe(1);
  });
});

describe("урок 22 · Зріж точно", () => {
  const setVal = (window, input, v) => { input.value = String(v); input.dispatchEvent(new window.Event("input", { bubbles: true })); };
  const check = (window, card, expr) => {
    const inp = card.querySelector("input[type=text]");
    setVal(window, inp, expr);
    card.querySelector("button[data-check]").click();
  };
  it("warmup: три швидкі питання з «чому», «Не знаю» = 0, повторний клік не фармить", async () => {
    const doc = (await loadPage("22-py-slice-precise")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    expect(doc.querySelector('nav.tabs button[data-tab="warmup"]').dataset.break).toBe("5");
    const items = [...doc.querySelectorAll("#warmup .pred-item")];
    expect(items.length).toBe(3);
    const right = items[0].querySelector("button[data-right]");
    right.click(); right.click();
    expect(score()).toBe(1);
    expect(items[0].querySelector(".why").textContent.length).toBeGreaterThan(10);
    items[1].querySelector("button[data-unknown]").click();
    expect(score()).toBe(1);
    items[1].querySelector("button[data-right]").click();
    expect(score()).toBe(1);
  });
  it("precise: 6–8 цілей, вираз перевіряється семантикою, ★ без додаткових балів", async () => {
    const window = await loadPage("22-py-slice-precise");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const cards = [...doc.querySelectorAll("#precise .target-card")];
    expect(cards.length).toBeGreaterThanOrEqual(6);
    expect(cards.length).toBeLessThanOrEqual(8);
    for (const c of cards) expect(c.querySelector("input[type=text]")).not.toBeNull();
    const before = score();
    const [c0, c1, c2] = cards;
    expect(c0.textContent).toContain("[10, 20, 30]");
    check(window, c0, "a[:3]");
    expect(score()).toBe(before + 1);
    expect(c0.querySelector(".star")).not.toBeNull();
    check(window, c0, "a[:3]");
    expect(score()).toBe(before + 1);
    check(window, c1, "a[0]");
    expect(score()).toBe(before + 1);
    expect(c1.querySelector(".fb").textContent).toMatch(/індекс/);
    check(window, c1, "b[-2:]");
    expect(c1.querySelector(".fb").textContent).toContain("a");
    check(window, c1, "a[-2:-1]");
    expect(score()).toBe(before + 1);
    expect(c1.querySelector(".fb").textContent).toContain("[70]");
    check(window, c1, " a[ -2 : ] ");
    expect(score()).toBe(before + 2);
    expect(c1.querySelector(".star")).not.toBeNull();
    check(window, c2, "a[1:8:2]");
    expect(score()).toBe(before + 3);
    expect(c2.querySelector(".star")).toBeNull();
  });
  it("precise: є цілі з від'ємним кроком і від'ємними індексами; крок 0 дає ValueError", async () => {
    const window = await loadPage("22-py-slice-precise");
    const doc = window.document;
    const cards = [...doc.querySelectorAll("#precise .target-card")];
    const t = cards.find(c => c.textContent.includes("[60, 50, 40]"));
    expect(t).toBeDefined();
    check(window, t, "a[::0]");
    expect(t.querySelector(".fb").textContent).toContain("ValueError");
    check(window, t, "a[5:2:-1]");
    expect(Number(doc.querySelector("[data-score]").textContent)).toBe(1);
    expect(cards.some(c => c.textContent.includes("[20, 30, 40, 50, 60, 70]"))).toBe(true);
  });
  it("precise: «Показати відповідь» блокує ціль із 0 балів і не дає добити", async () => {
    const window = await loadPage("22-py-slice-precise");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const card = doc.querySelectorAll("#precise .target-card")[3];
    expect(card.textContent).toContain("[30, 40, 50, 60]");
    card.querySelector("button[data-reveal]").click();
    expect(card.textContent).toContain("a[2:6]");
    expect(score()).toBe(0);
    check(window, card, "a[2:6]");
    expect(score()).toBe(0);
    expect(card.querySelector("input[type=text]").disabled).toBe(true);
    expect(card.querySelector("button[data-check]").disabled).toBe(true);
  });
  it("final: підказки задач із задачника", async () => {
    const doc = (await loadPage("22-py-slice-precise")).document;
    const t = doc.querySelector("#final").textContent;
    for (const id of ["middle", "window", "negative-indices"]) expect(t).toContain(id);
  });
});

describe("урок 23 · Склад списків", () => {
  it("theory: +, *, in, len, min/max/sum, порівняння", async () => {
    const t = (await loadPage("23-py-list-ops")).document.querySelector("#theory").textContent;
    for (const x of ["+", "*", "in", "len", "min", "max", "sum", "<"]) expect(t).toContain(x);
  });
  it("predict: обов'язкові фрагменти, «чому», «Не знаю» = 0, без фармінгу", async () => {
    const doc = (await loadPage("23-py-list-ops")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    expect(doc.querySelector('nav.tabs button[data-tab="predict"]').dataset.break).toBe("6");
    const items = [...doc.querySelectorAll("#predict .pred-item")];
    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items.length).toBeLessThanOrEqual(8);
    const by = t => items.find(i => i.querySelector(".pred-code").textContent.trim() === t);
    for (const c of ["[1, 2] * 3", "3 in [1, 2, 3]", "[1, 2] < [1, 3]", "sum([])", "[0] * 0", "len([[1, 2], [3]])"]) {
      expect(by(c), c).toBeDefined();
    }
    expect(by("[1, 2] * 3").querySelector("button[data-right]").textContent).toBe("[1, 2, 1, 2, 1, 2]");
    expect(by("sum([])").querySelector("button[data-right]").textContent).toBe("0");
    expect(by("len([[1, 2], [3]])").querySelector("button[data-right]").textContent).toBe("2");
    const r = by("3 in [1, 2, 3]").querySelector("button[data-right]");
    r.click(); r.click();
    expect(score()).toBe(1);
    expect(by("3 in [1, 2, 3]").querySelector(".why").textContent.length).toBeGreaterThan(10);
    by("sum([])").querySelector("button[data-unknown]").click();
    expect(score()).toBe(1);
    by("sum([])").querySelector("button[data-right]").click();
    expect(score()).toBe(1);
  });
  it("alias: b = a змінює a, b = a[:] — ні; візуалізація", async () => {
    const window = await loadPage("23-py-list-ops");
    const doc = window.document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const items = [...doc.querySelectorAll("#alias .pred-item")];
    expect(items.length).toBeGreaterThanOrEqual(3);
    const q1 = items.find(i => i.textContent.includes("b = a") && !i.textContent.includes("b = a["));
    expect(q1.querySelector("button[data-right]").textContent).toBe("[1, 2, 3]");
    const before = score();
    q1.querySelector("button[data-right]").click();
    expect(score()).toBe(before + 1);
    expect(q1.querySelector(".why").textContent).toContain("один і той самий");
    const q2 = items.find(i => i.textContent.includes("b = a[:]"));
    expect(q2.querySelector("button[data-right]").textContent).toBe("[1, 2]");
    q2.querySelector("button[data-unknown]").click();
    expect(score()).toBe(before + 1);
    const vis = doc.querySelector("#alias .alias-vis");
    expect(vis).not.toBeNull();
    doc.querySelector('#alias button[data-mode="same"]').click();
    expect(vis.querySelectorAll(".lst").length).toBe(1);
    doc.querySelector('#alias button[data-mode="copy"]').click();
    expect(vis.querySelectorAll(".lst").length).toBe(2);
    expect(score()).toBe(before + 1);
  });
  it("final і quiz", async () => {
    const doc = (await loadPage("23-py-list-ops")).document;
    expect(doc.querySelector("#quiz-tab .q").textContent.length).toBeGreaterThan(5);
    const t = doc.querySelector("#final").textContent;
    for (const id of ["concat-repeat", "in-list", "best-result"]) expect(t).toContain(id);
  });
});

function setRange(window, input, v) {
  input.value = String(v);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
}

describe("урок 24 · Робот-комірник", () => {
  it("theory: усі методи й що повертає", async () => {
    const t = (await loadPage("24-py-list-methods")).document.querySelector("#theory").textContent;
    for (const x of ["append", "insert", "remove", "pop", "sort", "reverse", "index", "count", "extend", "clear", "None"]) expect(t).toContain(x);
  });
  it("robot: 2–3 сценарії по 4–6 команд, 3 варіанти, перерва, наступний крок відкривається після відповіді", async () => {
    const doc = (await loadPage("24-py-list-methods")).document;
    expect(doc.querySelector('nav.tabs button[data-tab="robot"]').dataset.break).toBe("6");
    const sc = [...doc.querySelectorAll("#robot .scenario")];
    expect(sc.length).toBeGreaterThanOrEqual(2);
    expect(sc.length).toBeLessThanOrEqual(3);
    for (const s of sc) {
      const steps = [...s.querySelectorAll(".step")];
      expect(steps.length).toBeGreaterThanOrEqual(4);
      expect(steps.length).toBeLessThanOrEqual(6);
      for (const st of steps) {
        expect(st.querySelectorAll("button.opt:not(.skip)").length).toBe(3);
        expect(new Set([...st.querySelectorAll("button.opt:not(.skip)")].map(b => b.textContent)).size).toBe(3);
        expect(st.querySelectorAll("button[data-right]").length).toBe(1);
      }
      expect(steps[0].hidden).toBe(false);
      expect(steps[1].hidden).toBe(true);
      steps[0].querySelector("button[data-right]").click();
      expect(steps[1].hidden).toBe(false);
    }
  });
  it("robot: бал за кожен правильний крок, «Не знаю» дає 0, повтор не фармиться", async () => {
    const doc = (await loadPage("24-py-list-methods")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const s1 = doc.querySelectorAll("#robot .scenario")[0];
    const st = [...s1.querySelectorAll(".step")];
    expect(st[0].querySelector(".cmd").textContent).toContain("append");
    st[0].querySelector("button[data-right]").click();
    expect(score()).toBe(1);
    st[0].querySelector("button[data-right]").click();
    expect(score()).toBe(1);
    const wrong = [...st[1].querySelectorAll("button.opt:not(.skip)")].find(b => !b.hasAttribute("data-right"));
    wrong.click();
    expect(score()).toBe(1);
    expect(st[1].querySelector("button[data-right]").classList.contains("right")).toBe(true);
    st[2].querySelector("button[data-unknown]").click();
    expect(score()).toBe(1);
    st[2].querySelector("button[data-right]").click();
    expect(score()).toBe(1);
    expect(st[2].querySelector(".why").textContent).toContain("повернув 'лампа'");
  });
  it("robot: пастки remove першого входження, pop() повертає, a = a.sort() дає None й кінець сценарію", async () => {
    const doc = (await loadPage("24-py-list-methods")).document;
    const steps = [...doc.querySelectorAll("#robot .step")];
    const rm = doc.querySelectorAll("#robot .scenario")[1].querySelector(".step");
    expect(rm.querySelector(".cmd").textContent).toContain("remove('диск')");
    expect([...rm.closest(".scenario").querySelectorAll(".shelf .box")].map(b => b.textContent)).toEqual(["диск", "книга", "диск", "ручка"]);
    expect(rm).toBeDefined();
    expect(rm.querySelector("button[data-right]").textContent).toBe("['книга', 'диск', 'ручка']");
    const trap = steps.find(s => s.querySelector(".cmd").textContent.includes("a = a.sort()"));
    expect(trap).toBeDefined();
    expect(trap.querySelector("button[data-right]").textContent).toBe("None");
    const sc = trap.closest(".scenario");
    expect(sc.querySelectorAll(".step")[sc.querySelectorAll(".step").length - 1]).toBe(trap);
    trap.querySelector("button[data-right]").click();
    expect(trap.querySelector(".why").textContent).toContain("AttributeError");
    expect(trap.querySelector(".why").textContent).toContain("None");
    expect(sc.querySelector(".shelf").textContent).toContain("None");
  });
  it("robot: поведінка анімації враховує prefers-reduced-motion", () => {
    const html = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "lessons/24-py-list-methods/index.html"), "utf8");
    expect(html).toContain("prefers-reduced-motion");
  });
  it("final і quiz", async () => {
    const doc = (await loadPage("24-py-list-methods")).document;
    expect(doc.querySelectorAll("#quiz-tab .q").length).toBeGreaterThan(0);
    const t = doc.querySelector("#final").textContent;
    for (const id of ["remove-first", "sorted-desc", "queue-rotate"]) expect(t).toContain(id);
    expect(doc.querySelector("footer").textContent).toContain("Тема_21");
  });
});

describe("урок 25 · Лічильник range", () => {
  it("theory: stop не входить, три форми, крок", async () => {
    const t = (await loadPage("25-py-for-range")).document.querySelector("#theory").textContent;
    for (const x of ["range(5)", "range(2, 10, 3)", "не входить", "for", "step"]) expect(t).toContain(x);
  });
  it("counter: повзунки, числа, форми, step 0 → ValueError", async () => {
    const window = await loadPage("25-py-for-range");
    const doc = window.document;
    expect(doc.querySelector('nav.tabs button[data-tab="counter"]').dataset.break).toBe("5");
    const start = doc.querySelector("#c-start"), stop = doc.querySelector("#c-stop"), step = doc.querySelector("#c-step");
    expect(step.min).toBe("-5");
    expect(step.max).toBe("5");
    doc.querySelector('#counter [data-form="start-stop-step"]').click();
    setRange(window, start, 2); setRange(window, stop, 10); setRange(window, step, 3);
    expect(doc.querySelector("#c-code").textContent).toBe("range(2, 10, 3)");
    expect(doc.querySelector("#c-values").textContent).toContain("2, 5, 8");
    expect(doc.querySelector("#c-desc").textContent).toContain("від 2 до 10 (не включно) з кроком 3");
    setRange(window, start, 10); setRange(window, stop, 0); setRange(window, step, -3);
    expect(doc.querySelector("#c-values").textContent).toContain("10, 7, 4, 1");
    setRange(window, step, 0);
    expect(doc.querySelector("#c-error").textContent).toContain("ValueError");
    expect(doc.querySelector("#c-values").textContent).not.toContain("10");
    doc.querySelector('#counter [data-form="stop"]').click();
    setRange(window, stop, 5);
    expect(doc.querySelector("#c-code").textContent).toBe("range(5)");
    expect(doc.querySelector("#c-values").textContent).toContain("0, 1, 2, 3, 4");
    expect(doc.querySelector("#c-error").textContent).toBe("");
    doc.querySelector('#counter [data-form="start-stop"]').click();
    setRange(window, start, 5); setRange(window, stop, 1);
    expect(doc.querySelector("#c-desc").textContent).toContain("порожня");
    expect(Number(doc.querySelector("[data-score]").textContent)).toBe(0);
  });
  it("predict: обов'язкові range, «Не знаю» = 0, без фармінгу", async () => {
    const doc = (await loadPage("25-py-for-range")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const items = [...doc.querySelectorAll("#predict .pred-item")];
    expect(items.length).toBeGreaterThanOrEqual(5);
    const by = t => items.find(i => i.querySelector(".pred-code").textContent.trim() === t);
    const ans = { "range(5)": "[0, 1, 2, 3, 4]", "range(2, 10, 3)": "[2, 5, 8]", "range(10, 0, -3)": "[10, 7, 4, 1]", "range(5, 1)": "[]" };
    for (const [c, a] of Object.entries(ans)) {
      expect(by(c), c).toBeDefined();
      expect(by(c).querySelector("button[data-right]").textContent).toBe(a);
    }
    by("range(5)").querySelector("button[data-right]").click();
    by("range(5)").querySelector("button[data-right]").click();
    expect(score()).toBe(1);
    expect(by("range(5)").querySelector(".why").textContent.length).toBeGreaterThan(10);
    by("range(5, 1)").querySelector("button[data-unknown]").click();
    by("range(5, 1)").querySelector("button[data-right]").click();
    expect(score()).toBe(1);
  });
  it("trace: пострічкова перевірка, бал за рядок, відповіді блокують без балів", async () => {
    const doc = (await loadPage("25-py-for-range")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const tables = [...doc.querySelectorAll("#trace .trace-table")];
    expect(tables.length).toBe(2);
    expect(tables[0].closest(".card").textContent).toContain("range(1, 5)");
    expect(tables[1].closest(".card").textContent).toContain("i % 2 == 0");
    const rows = [...tables[0].querySelectorAll("tr.trace-row")];
    expect(rows.length).toBe(4);
    const fill = (row, vals) => { for (const [k, v] of Object.entries(vals)) row.querySelector('[data-col="' + k + '"]').value = v; row.querySelector("button[data-check]").click(); };
    fill(rows[0], { i: "1", s: "2" });
    expect(score()).toBe(0);
    expect(rows[0].querySelector(".fb").textContent.length).toBeGreaterThan(3);
    fill(rows[0], { i: "1", s: "1" });
    expect(score()).toBe(1);
    fill(rows[0], { i: "1", s: "1" });
    expect(score()).toBe(1);
    expect(rows[0].querySelector("input").disabled).toBe(true);
    tables[0].closest(".card").querySelector("button[data-reveal]").click();
    expect(rows[3].querySelector('[data-col="s"]').value).toBe("10");
    expect(rows[3].querySelector("input").disabled).toBe(true);
    expect(score()).toBe(1);
    fill(rows[3], { i: "4", s: "10" });
    expect(score()).toBe(1);
    const rows2 = [...tables[1].querySelectorAll("tr.trace-row")];
    expect(rows2.length).toBe(6);
    fill(rows2[1], { i: "2", cond: "Так", s: "2" });
    expect(score()).toBe(2);
    fill(rows2[0], { i: "1", cond: "Так", s: "1" });
    expect(score()).toBe(2);
    fill(rows2[5], { i: "6", cond: "Так", s: "12" });
    expect(score()).toBe(3);
  });
  it("final і quiz", async () => {
    const doc = (await loadPage("25-py-for-range")).document;
    expect(doc.querySelectorAll("#quiz-tab .q").length).toBeGreaterThan(0);
    const t = doc.querySelector("#final").textContent;
    for (const id of ["countdown", "points-sum", "range-line"]) expect(t).toContain(id);
    expect(doc.querySelector("footer").textContent).toContain("Тема_22");
  });
});

describe("реєстрація уроків inf10deep", () => {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const window = new JSDOM("", { runScripts: "outside-only" }).window;
  loadScript(window, "lessons.js");
  loadScript(window, "data/teacher-plans.js");
  const entries = window.LESSONS.filter(l => l.program === "inf10deep" && l.num >= 18);

  it("є уроки 18–25", () => {
    expect(entries.map(e => e.num)).toEqual(expect.arrayContaining([18, 19, 20, 21, 22, 23, 24, 25]));
  });
  for (const entry of entries) {
    it("урок " + entry.num + ": файли на диску й план на 45 хв", () => {
      expect(entry.status).toBe("ready");
      expect(entry.teacher).toBe(true);
      for (const f of ["index.html", "teacher.html"]) {
        expect(fs.existsSync(path.join(ROOT, "lessons", entry.folder, f)), entry.folder + "/" + f).toBe(true);
      }
      const plan = window.TEACHER_PLANS["inf10deep:" + entry.num];
      expect(plan, "inf10deep:" + entry.num).toBeDefined();
      expect(plan.duration).toBe(45);
      expect(plan.timeline.reduce((s, t) => s + t.min, 0)).toBe(45);
      for (const t of plan.timeline) {
        if (t.link) expect(t.link.startsWith("#"), "timeline link: " + t.link).toBe(true);
        if (t.kind === "break") expect(t.projector).toBe(true);
      }
    });
  }
});

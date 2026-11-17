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
  { folder: "21-py-list-slices", num: 21, topic: "slices", tabs: ["theory", "train", "predict", "quiz-tab", "final"] }
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

describe("реєстрація уроків inf10deep", () => {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const window = new JSDOM("", { runScripts: "outside-only" }).window;
  loadScript(window, "lessons.js");
  loadScript(window, "data/teacher-plans.js");
  const entries = window.LESSONS.filter(l => l.program === "inf10deep" && l.num >= 18);

  it("є уроки 18–21", () => {
    expect(entries.map(e => e.num)).toEqual(expect.arrayContaining([18, 19, 20, 21]));
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

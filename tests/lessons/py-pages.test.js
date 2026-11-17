import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, it, expect, afterEach } from "vitest";
import { loadPage, loadScript, closePages } from "../helpers/load-script.js";

afterEach(closePages);

const LESSONS = [
  { folder: "18-py-types", num: 18, topic: "types", tabs: ["theory", "customs", "predict", "quiz-tab", "final"] },
  { folder: "19-py-branching", num: 19, topic: "branching", tabs: ["theory", "trace", "truth", "quiz-tab", "final"] }
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

describe("реєстрація уроків inf10deep", () => {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const window = new JSDOM("", { runScripts: "outside-only" }).window;
  loadScript(window, "lessons.js");
  loadScript(window, "data/teacher-plans.js");
  const entries = window.LESSONS.filter(l => l.program === "inf10deep" && l.num >= 18);

  it("є хоча б уроки 18 і 19", () => {
    expect(entries.map(e => e.num)).toEqual(expect.arrayContaining([18, 19]));
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

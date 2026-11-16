import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let lab;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  loadScript(window, "assets/boards/lab.js");
  lab = window.Boards.lab;
});

describe("lab.CHECKLIST", () => {
  it("8–10 пунктів з унікальними id, текстом і поясненням", () => {
    expect(lab.CHECKLIST.length).toBeGreaterThanOrEqual(8);
    expect(lab.CHECKLIST.length).toBeLessThanOrEqual(10);
    expect(new Set(lab.CHECKLIST.map((c) => c.id)).size).toBe(lab.CHECKLIST.length);
    for (const c of lab.CHECKLIST) {
      expect(c.text).toBeTruthy();
      expect(c.why).toBeTruthy();
    }
  });
});

describe("lab.buildReport", () => {
  it("містить заповнені блоки й пропускає порожні", () => {
    const r = lab.buildReport({ goal: "Блимати", code: "" });
    expect(r).toContain("Звіт з лабораторної роботи");
    expect(r).toContain("Мета:");
    expect(r).toContain("Блимати");
    expect(r).not.toContain("Код");
  });
});

describe("lab.gradeReport", () => {
  it("порожній звіт: missing має всі обов'язкові поля", () => {
    const g = lab.gradeReport({});
    const req = lab.REPORT_FIELDS.filter((f) => f.required).map((f) => f.label);
    expect(req.length).toBeGreaterThan(0);
    for (const l of req) expect(g.missing).toContain(l);
    expect(g.hints.length).toBeGreaterThan(0);
  });
  it("повний звіт: нічого не бракує", () => {
    const f = {};
    for (const x of lab.REPORT_FIELDS) f[x.id] = "текст достатньої довжини для перевірки";
    expect(lab.gradeReport(f).missing).toEqual([]);
  });
});

describe("lab.TROUBLES", () => {
  it("не менше 6 збоїв із причиною й виправленням", () => {
    expect(lab.TROUBLES.length).toBeGreaterThanOrEqual(6);
    for (const t of lab.TROUBLES) {
      expect(t.symptom).toBeTruthy();
      expect(t.cause).toBeTruthy();
      expect(t.fix).toBeTruthy();
    }
  });
});

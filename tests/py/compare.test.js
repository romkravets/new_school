import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let C;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  loadScript(window, "assets/py/compare.js");
  C = window.Py.compare;
});

describe("compare", () => {
  it("normalize", () => {
    expect(C.normalize("a  \nb\n\n")).toEqual(["a", "b"]);
  });
  it("compareOutput: кінцеві пробіли й порожні рядки ігноруються", () => {
    expect(C.compareOutput("1\n2", "1\n2 \n").ok).toBe(true);
  });
  it("пробіли всередині значущі", () => {
    const r = C.compareOutput("a b", "a  b");
    expect(r.ok).toBe(false);
    expect(r.line).toBe(1);
    expect(r.expected).toBe("a b");
    expect(r.actual).toBe("a  b");
  });
  it("float без tolerance не збігається", () => {
    expect(C.compareOutput("0.3", "0.30000000000000004").ok).toBe(false);
    expect(C.compareOutput("0.3", "0.30000000000000004", 1e-6).ok).toBe(true);
  });
  it("tolerance на числовий токен у рядку", () => {
    expect(C.compareOutput("x 0.5 y", "x 0.5000001 y", 1e-3).ok).toBe(true);
    expect(C.compareOutput("x 0.5 y", "x 0.6 y", 1e-3).ok).toBe(false);
  });
  it("номер першого розбіжного рядка, різна кількість рядків", () => {
    expect(C.compareOutput("1\n2\n3", "1\n5\n3").line).toBe(2);
    const r = C.compareOutput("1\n2", "1");
    expect(r.ok).toBe(false);
    expect(r.line).toBe(2);
    expect(r.actual).toBe(null);
  });
  it("ok: line і рядки null", () => {
    expect(C.compareOutput("a", "a")).toEqual({ ok: true, line: null, expected: null, actual: null });
  });
  it("explainMismatch: перезапис змінних", () => {
    const task = { tests: [{ out: "5" }, { out: "9" }] };
    const msg = C.explainMismatch(task, task.tests[1], { stdout: "5\n", error: null });
    expect(msg).toContain("не перезаписуй змінні");
  });
  it("explainMismatch: інакше називає номер тесту", () => {
    const task = { tests: [{ out: "5" }, { out: "9" }] };
    const msg = C.explainMismatch(task, task.tests[1], { stdout: "7", error: null });
    expect(msg).not.toContain("не перезаписуй");
    expect(msg).toContain("2");
  });
  it("explainMismatch: видимий тест не дає підказки про перезапис", () => {
    const task = { tests: [{ out: "5" }, { out: "9" }] };
    const msg = C.explainMismatch(task, task.tests[0], { stdout: "4", error: null });
    expect(msg).not.toContain("не перезаписуй");
  });
  it("працює в plain vm", async () => {
    const fs = await import("node:fs");
    const vm = await import("node:vm");
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync("assets/py/compare.js", "utf8"), ctx);
    expect(ctx.window.Py.compare.compareOutput("a", "a").ok).toBe(true);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let E;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  loadScript(window, "assets/py/errors.js");
  E = window.Py.errors;
});

describe("errors.hint", () => {
  it("NameError з іменем і рядком", () => {
    const tb = 'Traceback (most recent call last):\n  File "<exec>", line 3, in <module>\nNameError: name \'x\' is not defined';
    const h = E.hint(tb);
    expect(h.type).toBe("NameError");
    expect(h.line).toBe(3);
    expect(h.text).toContain("x");
  });
  it("береться останній File <exec>", () => {
    const tb = 'Traceback:\n  File "<exec>", line 1, in <module>\n  File "<exec>", line 7, in f\nValueError: bad';
    expect(E.hint(tb).line).toBe(7);
  });
  it("ZeroDivisionError без рядка", () => {
    const h = E.hint("ZeroDivisionError: division by zero");
    expect(h.type).toBe("ZeroDivisionError");
    expect(h.line).toBe(null);
    expect(h.text).toContain("нуль");
  });
  it("усі типи мають непорожній текст", () => {
    for (const t of ["TypeError", "ValueError", "IndentationError", "SyntaxError", "IndexError", "KeyError", "AttributeError"]) {
      const h = E.hint(t + ": something");
      expect(h.type).toBe(t);
      expect(h.text.length).toBeGreaterThan(10);
    }
  });
  it("IndentationError не плутається з SyntaxError; невідомий тип", () => {
    expect(E.hint("  File \"<exec>\", line 2\nIndentationError: unexpected indent").type).toBe("IndentationError");
    const h = E.hint("RuntimeError: boom");
    expect(h.type).toBe("RuntimeError");
    expect(h.text.length).toBeGreaterThan(10);
  });
});

describe("errors: input()", () => {
  it("RuntimeError про input() дає спеціальну підказку", () => {
    const h = E.hint('Traceback (most recent call last):\n  File "<exec>", line 3, in <module>\nRuntimeError: input() тут не працює: дані вже є у змінних\n');
    expect(h.type).toBe("RuntimeError");
    expect(h.line).toBe(3);
    expect(h.text).toBe("Дані вже лежать у змінних із «Вхідних даних» — використай їх замість input().");
  });
  it("clean прибирає кадр <guard>", () => {
    const tb = 'Traceback (most recent call last):\n  File "<exec>", line 3, in <module>\n    x = input()\n  File "<guard>", line 2, in _input_blocked\n    raise RuntimeError("m")\nRuntimeError: input() тут не працює\n';
    const c = E.clean(tb);
    expect(c).not.toContain("<guard>");
    expect(c).toContain('line 3');
  });
});

describe("errors.clean", () => {
  it("прибирає кадри Pyodide, лишає <exec> і фінальну помилку", () => {
    const tb = 'Traceback (most recent call last):\n  File "/lib/python312.zip/_pyodide/_base.py", line 523, in eval_code\n    .run(globals, locals)\n     ^^^^^^^^^^^^^^^^^^^^\n  File "/lib/python312.zip/_pyodide/_base.py", line 357, in run\n    coroutine = eval(self.code, globals, locals)\n  File "<exec>", line 3, in <module>\n    print(x)\n  File "<exec>", line 2, in f\n    return 1/0\nZeroDivisionError: division by zero\n';
    const c = E.clean(tb);
    expect(c).toBe('Traceback (most recent call last):\n  File "<exec>", line 3, in <module>\n    print(x)\n  File "<exec>", line 2, in f\n    return 1/0\nZeroDivisionError: division by zero\n');
    expect(c).not.toContain("_pyodide");
  });
});

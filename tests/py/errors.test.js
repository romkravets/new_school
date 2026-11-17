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

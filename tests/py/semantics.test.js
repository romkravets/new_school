import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let S, R, L;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  ["slice", "range", "listsim"].forEach((n) => loadScript(window, "assets/py/" + n + ".js"));
  S = window.Py.slice; R = window.Py.range; L = window.Py.listsim;
  // jsdom-масиви з іншого realm: порівнюємо через JSON
});
const j = (x) => JSON.parse(JSON.stringify(x));
const a = [0, 1, 2, 3, 4];

describe("Py.slice", () => {
  it("базові зрізи", () => {
    expect(j(S.slice(a, 1, 4))).toEqual([1, 2, 3]);
    expect(j(S.slice(a, null, null, -1))).toEqual([4, 3, 2, 1, 0]);
    expect(j(S.slice(a, -2))).toEqual([3, 4]);
    expect(j(S.slice(a, 5, 1))).toEqual([]);
    expect(j(S.slice(a, 2, 10))).toEqual([2, 3, 4]);
  });
  it("від'ємні індекси за межами обрізаються", () => {
    expect(j(S.slice(a, -100, 100))).toEqual(a);
    expect(j(S.slice(a, -100, -3))).toEqual([0, 1]);
    expect(j(S.slice(a, 100, -100, -1))).toEqual([4, 3, 2, 1, 0]);
    expect(j(S.slice(a, undefined, -100))).toEqual([]);
  });
  it("кроки", () => {
    expect(j(S.slice(a, null, null, 2))).toEqual([0, 2, 4]);
    expect(j(S.slice(a, 3, 0, -2))).toEqual([3, 1]);
    expect(j(S.slice(a, 3, null, -1))).toEqual([3, 2, 1, 0]);
    expect(j(S.slice(a, null, 1, -1))).toEqual([4, 3, 2]);
    expect(j(S.slice(a, 1, 4, -1))).toEqual([]);
    expect(j(S.slice([], null, null, -1))).toEqual([]);
  });
  it("step 0 -> ValueError", () => {
    expect(S.slice(a, 0, 3, 0).error).toBe("ValueError");
  });
  it("рядки", () => {
    expect(S.slice("python", 1, 4)).toBe("yth");
    expect(S.slice("python", null, null, -1)).toBe("nohtyp");
  });
  it("не мутує вхід", () => {
    const b = [1, 2, 3]; S.slice(b, null, null, -1);
    expect(b).toEqual([1, 2, 3]);
  });
  it("index", () => {
    expect(S.index(a, 10).error).toBe("IndexError");
    expect(S.index(a, 10).ok).toBe(false);
    expect(S.index(a, -1)).toEqual({ ok: true, value: 4 });
    expect(S.index(a, -5).value).toBe(0);
    expect(S.index(a, -6).error).toBe("IndexError");
    expect(S.index(a, 5).error).toBe("IndexError");
    expect(S.index("abc", 1).value).toBe("b");
  });
  it("parse", () => {
    expect(j(S.parse("a[::-1]"))).toMatchObject({ kind: "slice", start: null, stop: null, step: -1, name: "a" });
    expect(j(S.parse("a[-2:]"))).toMatchObject({ kind: "slice", start: -2, stop: null, step: null });
    expect(j(S.parse("a[3]"))).toMatchObject({ kind: "index", i: 3 });
    expect(j(S.parse("  nums[ 1 : 4 ] "))).toMatchObject({ kind: "slice", start: 1, stop: 4, step: null, name: "nums" });
    expect(j(S.parse("a[1:4:2]"))).toMatchObject({ start: 1, stop: 4, step: 2 });
    expect(j(S.parse("a[-1]"))).toMatchObject({ kind: "index", i: -1 });
  });
  it("parse відхиляє все інше", () => {
    ["", "a", "a[]", "a[1:2:3:4]", "a[x]", "a[1+1]", "a[1.5]", "1[2]", "a[0](", "alert(1)", "a[1:2]; b", "a[- 1]", "a[::]x"].forEach((s) => {
      expect(S.parse(s), s).toBeNull();
    });
    expect(S.parse(null)).toBeNull();
  });
  it("toExpr", () => {
    expect(S.toExpr({ start: 1, stop: 4, step: null })).toBe("a[1:4]");
    expect(S.toExpr({ start: null, stop: null, step: -1 })).toBe("a[::-1]");
    expect(S.toExpr({ start: 2, stop: null, step: null })).toBe("a[2:]");
    expect(S.toExpr({ start: null, stop: null, step: null })).toBe("a[:]");
    expect(S.toExpr({ start: 1, stop: 4, step: 2 }, "s")).toBe("s[1:4:2]");
    expect(S.toExpr({ start: null, stop: 3, step: 1 })).toBe("a[:3]");
  });
});

describe("Py.range", () => {
  it("values", () => {
    expect(j(R.values(10, 0, -3))).toEqual([10, 7, 4, 1]);
    expect(j(R.values(5, 1))).toEqual([]);
    expect(j(R.values(5))).toEqual([0, 1, 2, 3, 4]);
    expect(j(R.values(1, 10, 3))).toEqual([1, 4, 7]);
    expect(j(R.values(0, 0))).toEqual([]);
    expect(j(R.values(-3, 2))).toEqual([-3, -2, -1, 0, 1]);
    expect(j(R.values(0, 5, -1))).toEqual([]);
    expect(j(R.values(3, 3, null))).toEqual([]);
  });
  it("помилки", () => {
    expect(R.values(0, 5, 0).error).toBe("ValueError");
    expect(R.values(0, 5000).error).toBe("TooLong");
    expect(R.values(0, 1.5).error).toBe("TypeError");
    expect(R.values(1000).length).toBe(1000);
  });
  it("describe", () => {
    expect(R.describe(10, 0, -3)).toBe("від 10 до 0 (не включно) з кроком −3");
    expect(R.describe(0, 5, 1)).toBe("від 0 до 5 (не включно) з кроком 1");
    expect(R.describe(0, 5, 0)).toMatch(/ValueError/);
    expect(R.describe(5, 1, 1)).toMatch(/порожня/);
  });
});

describe("Py.listsim", () => {
  const ap = (l, m, ...args) => j(L.apply(l, { method: m, args }));
  it("sort", () => {
    expect(ap([3, 1, 2], "sort")).toMatchObject({ list: [1, 2, 3], returned: null, error: null });
    expect(ap([3, 1, 2], "sort", { reverse: true }).list).toEqual([3, 2, 1]);
    expect(j(L.apply([1, 3, 2], { method: "sort", kwargs: { reverse: true } })).list).toEqual([3, 2, 1]);
    expect(ap(["b", "a"], "sort").list).toEqual(["a", "b"]);
    expect(ap([10, 9, 100], "sort").list).toEqual([9, 10, 100]);
    expect(ap([1, "a"], "sort")).toMatchObject({ error: "TypeError", list: [1, "a"] });
  });
  it("не мутує вхід", () => {
    const l = [3, 1, 2];
    const r = L.apply(l, { method: "sort" });
    expect(l).toEqual([3, 1, 2]);
    expect(r.list).not.toBe(l);
  });
  it("remove / pop / index / count", () => {
    expect(ap([1, 2, 1], "remove", 1).list).toEqual([2, 1]);
    expect(ap([1], "remove", 5).error).toBe("ValueError");
    expect(ap([1, 2], "pop")).toMatchObject({ returned: 2, list: [1] });
    expect(ap([1, 2, 3], "pop", 0)).toMatchObject({ returned: 1, list: [2, 3] });
    expect(ap([1, 2, 3], "pop", -2)).toMatchObject({ returned: 2, list: [1, 3] });
    expect(ap([], "pop").error).toBe("IndexError");
    expect(ap([1], "pop", 3).error).toBe("IndexError");
    expect(ap([5, 6, 5], "index", 5).returned).toBe(0);
    expect(ap([5], "index", 7).error).toBe("ValueError");
    expect(ap([5, 6, 5], "count", 5).returned).toBe(2);
    expect(ap([], "count", 5).returned).toBe(0);
  });
  it("append / insert / extend / reverse / clear", () => {
    expect(ap([1], "append", 2)).toMatchObject({ list: [1, 2], returned: null });
    expect(ap([1, 2], "insert", 1, 9).list).toEqual([1, 9, 2]);
    expect(ap([1, 2], "insert", 50, 9).list).toEqual([1, 2, 9]);
    expect(ap([1, 2], "insert", -1, 9).list).toEqual([1, 9, 2]);
    expect(ap([1, 2], "insert", -50, 9).list).toEqual([9, 1, 2]);
    expect(ap([1], "extend", [2, 3]).list).toEqual([1, 2, 3]);
    expect(ap([1], "extend", "ab").list).toEqual([1, "a", "b"]);
    expect(ap([1, 2, 3], "reverse")).toMatchObject({ list: [3, 2, 1], returned: null });
    expect(ap([1, 2], "clear")).toMatchObject({ list: [], returned: null });
  });
  it("невідомий метод і бракує аргументів", () => {
    expect(ap([1], "fly").error).toBe("AttributeError");
    expect(ap([1], "append").error).toBe("TypeError");
  });
  it("assign: a = a.method()", () => {
    const r = j(L.assign([3, 1, 2], { method: "sort" }));
    expect(r.list).toBeNull();
    expect(r.mutated).toEqual([1, 2, 3]);
    expect(j(L.assign([1, 2], { method: "pop" })).list).toBe(2);
    expect(j(L.assign([1], { method: "append", args: [2] })).list).toBeNull();
    expect(j(L.assign([1], { method: "remove", args: [9] }))).toMatchObject({ error: "ValueError", list: [1] });
  });
});

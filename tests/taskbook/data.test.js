import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const win = {};
const ctx = vm.createContext({ window: win });
vm.runInContext(fs.readFileSync(path.join(ROOT, "data/taskbook/index.js"), "utf8"), ctx, { filename: "index.js" });
const index = win.TASKBOOK_INDEX || [];
for (const t of index) {
  const f = path.join(ROOT, "data/taskbook", t.id + ".js");
  if (fs.existsSync(f)) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: t.id + ".js" });
}
const TB = win.TASKBOOK || {};

describe("taskbook index", () => {
  it("has the types topic", () => {
    expect(index.map((t) => t.id)).toContain("types");
  });
  for (const topic of index) {
    it(`${topic.id}: count matches loaded array`, () => {
      expect(Array.isArray(TB[topic.id])).toBe(true);
      expect(TB[topic.id].length).toBe(topic.count);
    });
  }
});

for (const topic of index) {
  const tasks = TB[topic.id] || [];
  describe(`taskbook/${topic.id}`, () => {
    it("ids are unique kebab-case", () => {
      const ids = tasks.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
    for (const t of tasks) {
      it(`${t.id}: structure`, () => {
        for (const k of ["id", "title", "emoji", "text", "starter", "hint"]) {
          expect(typeof t[k], k).toBe("string");
          expect(t[k].length, k).toBeGreaterThan(0);
        }
        const src = t.source;
        const okSource = src === null || (typeof src === "object" && typeof src.author === "string" && src.author.trim() !== "" && typeof src.ref === "string" && src.ref.trim() !== "");
        expect(okSource).toBe(true);
        expect(t.vars && typeof t.vars === "object").toBe(true);
        expect(t.tests.length).toBeGreaterThanOrEqual(3);
        expect(t.tests.length).toBeLessThanOrEqual(5);
        expect(t.tests[0].vars).toEqual(t.vars);
        const keys = Object.keys(t.vars).sort();
        for (const test of t.tests) {
          expect(Object.keys(test.vars).sort()).toEqual(keys);
          expect(typeof test.out).toBe("string");
        }
        for (const k of keys) expect(t.starter).not.toMatch(new RegExp("^\\s*" + k + "\\s*=", "m"));
      });
      it(`${t.id}: solution file exists`, () => {
        expect(fs.existsSync(path.join(ROOT, "taskbook/solutions", topic.id, t.id + ".py"))).toBe(true);
      });
      it(`${t.id}: float output has tolerance or round in text`, () => {
        const long = t.tests.some((x) => /\d\.\d{4,}/.test(x.out));
        if (long) expect(t.tolerance != null || /round/.test(t.text)).toBe(true);
      });
    }
  });
}

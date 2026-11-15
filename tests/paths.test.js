import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "./helpers/load-script.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const window = new JSDOM("", { runScripts: "outside-only" }).window;
loadScript(window, "data/course-labs.js");
loadScript(window, "programs.js");

describe("шляхи до документів", () => {
  it("кожен materials[].path існує", () => {
    const paths = [];
    for (const course of Object.values(window.COURSE_LABS))
      for (const entry of Object.values(course))
        for (const m of entry.materials || []) paths.push(m.path);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) expect(fs.existsSync(path.join(ROOT, p)), p).toBe(true);
  });

  it("кожен sources[] існує у documents/", () => {
    for (const program of window.PROGRAMS)
      for (const s of program.sources)
        expect(fs.existsSync(path.join(ROOT, "documents", s)), s).toBe(true);
  });

  it("python — 11 клас", () => {
    expect(window.PROGRAMS.find(p => p.id === "python").grade).toBe(11);
  });
});

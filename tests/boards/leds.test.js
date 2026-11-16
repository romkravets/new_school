import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let leds;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  loadScript(window, "assets/boards/leds.js");
  leds = window.Boards.leds;
});

const seq = (r) => r.events.map((e) => e.i);

describe("leds.checkWiring", () => {
  it("правильна схема", () => {
    expect(leds.checkWiring({ anode: "pin5", cathode: "gnd", resistor: "anode" })).toEqual({ ok: true, problems: [] });
  });
  it("резистор на катоді теж ок", () => {
    expect(leds.checkWiring({ anode: "pin5", cathode: "gnd", resistor: "cathode" }).ok).toBe(true);
  });
  it("перевернутий світлодіод", () => {
    const r = leds.checkWiring({ anode: "gnd", cathode: "pin5", resistor: "anode" });
    expect(r.ok).toBe(false);
    expect(r.problems).toContain("reversed");
  });
  it("без резистора", () => {
    const r = leds.checkWiring({ anode: "pin5", cathode: "gnd", resistor: "none" });
    expect(r.ok).toBe(false);
    expect(r.problems).toContain("no-resistor");
  });
  it("анод на 5V напряму", () => {
    const r = leds.checkWiring({ anode: "5v", cathode: "gnd", resistor: "none" });
    expect(r.problems).toContain("direct-5v");
    expect(r.problems).toContain("anode-not-pin");
  });
  it("катод не на GND", () => {
    expect(leds.checkWiring({ anode: "pin5", cathode: "none", resistor: "anode" }).problems).toContain("cathode-not-gnd");
  });
});

describe("leds.runLoops", () => {
  it("0..2", () => {
    expect(seq(leds.runLoops([{ start: 0, cond: "<3", step: "i++", body: "on(i)" }]))).toEqual([0, 1, 2]);
  });
  it("туди-назад", () => {
    const r = leds.runLoops([
      { start: 0, cond: "<3", step: "i++", body: "on(i)" },
      { start: 2, cond: ">=0", step: "i--", body: "on(i)" }
    ]);
    expect(seq(r)).toEqual([0, 1, 2, 2, 1, 0]);
    expect(r.iterations).toBe(6);
    expect(leds.checkTask("bounce", r.events)).toBe(true);
  });
  it("<=3 виходить за межі", () => {
    const r = leds.runLoops([{ start: 0, cond: "<=3", step: "i++", body: "blink(i)" }]);
    expect(r.problems).toEqual(["index-out-of-range"]);
    expect(r.events[r.events.length - 1]).toEqual({ i: 3, missing: true });
  });
  it("нескінченний цикл", () => {
    const r = leds.runLoops([{ start: 0, cond: ">=0", step: "i++", body: "on(i)" }]);
    expect(r.infinite).toBe(true);
    expect(r.iterations).toBe(50);
    expect(r.events.length).toBe(50);
  });
});

describe("leds.checkTask", () => {
  it("all", () => {
    expect(leds.checkTask("all", leds.runLoops([{ start: 0, cond: "<3", step: "i++", body: "on(i)" }]).events)).toBe(true);
    expect(leds.checkTask("all", [{ i: 0 }, { i: 1 }])).toBe(false);
  });
  it("ігнорує missing", () => {
    expect(leds.checkTask("all", [{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3, missing: true }])).toBe(true);
  });
  it("невідоме завдання", () => {
    expect(leds.checkTask("nope", [])).toBe(false);
  });
});

describe("leds.trafficLightSteps / PINS", () => {
  it("5 кроків", () => {
    const s = leds.trafficLightSteps();
    expect(s).toHaveLength(5);
    expect(s[0].seconds).toBe(3);
    expect(s[0].text).toContain("зелен");
    expect(s[4].seconds).toBe(1);
  });
  it("PINS", () => {
    expect(leds.PINS).toEqual({ red: 7, yellow: 6, green: 5 });
  });
});

describe("leds.runLoops — невалідні ключі", () => {
  it("успадковані ключі (constructor/toString) не проходять як умова чи крок", () => {
    const r = leds.runLoops([{ start: 0, cond: "constructor", step: "toString", body: "on(i)" }]);
    expect(r.events).toEqual([]);
    expect(r.infinite).toBe(false);
  });
  it("i+=2 з <3 → [0,2]", () => {
    expect(seq(leds.runLoops([{ start: 0, cond: "<3", step: "i+=2", body: "on(i)" }]))).toEqual([0, 2]);
  });
});

describe("leds.checkTask — біжучий вогник", () => {
  const run = (body) => [{ start: 0, cond: "<3", step: "i++", body }];
  it("є серед завдань", () => {
    expect(leds.TASKS.map((t) => t.id)).toContain("chaser");
  });
  it("0→1→2 з blink(i) — виконано", () => {
    const loops = run("blink(i)");
    expect(leds.checkTask("chaser", leds.runLoops(loops).events, loops)).toBe(true);
  });
  it("on(i) не зараховується: світлодіоди не гаснуть", () => {
    const loops = run("on(i)");
    expect(leds.checkTask("chaser", leds.runLoops(loops).events, loops)).toBe(false);
  });
  it("без опису циклів не зараховується", () => {
    expect(leds.checkTask("chaser", [{ i: 0 }, { i: 1 }, { i: 2 }])).toBe(false);
  });
  it("хибний порядок не зараховується", () => {
    const loops = [{ start: 2, cond: ">=0", step: "i--", body: "blink(i)" }];
    expect(leds.checkTask("chaser", leds.runLoops(loops).events, loops)).toBe(false);
  });
  it("завдання без вимоги до тіла приймають будь-яке тіло", () => {
    const loops = run("blink(i)");
    expect(leds.checkTask("all", leds.runLoops(loops).events, loops)).toBe(true);
  });
});

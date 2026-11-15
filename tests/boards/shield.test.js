import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let shield;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  loadScript(window, "assets/boards/shield.js");
  shield = window.Boards.shield;
});

describe("shield.PIN_GROUPS", () => {
  it("не менше 6 груп з унікальними id і примітками", () => {
    expect(shield.PIN_GROUPS.length).toBeGreaterThanOrEqual(6);
    const ids = shield.PIN_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of shield.PIN_GROUPS) {
      expect(g.label).toBeTruthy();
      expect(g.note).toBeTruthy();
      expect(g.pins.length).toBeGreaterThan(0);
    }
  });
  it("ШІМ-піни UNO", () => {
    const pwm = shield.PIN_GROUPS.find((g) => g.kind === "pwm").pins;
    for (const p of ["3", "5", "6", "9", "10", "11"]) expect(pwm).toContain(p);
  });
  it("аналогові, I2C, UART і живлення", () => {
    const by = (k) => shield.PIN_GROUPS.find((g) => g.kind === k).pins;
    for (const p of ["A0", "A1", "A2", "A3", "A4", "A5"]) expect(by("analog")).toContain(p);
    expect(by("i2c")).toEqual(expect.arrayContaining(["SDA", "SCL"]));
    expect(by("uart")).toEqual(expect.arrayContaining(["0", "1"]));
    expect(by("power")).toEqual(expect.arrayContaining(["5V", "3.3V", "GND", "VIN"]));
  });
});

describe("shield.MODULES", () => {
  it("12 модулів із допустимими io і connector", () => {
    expect(shield.MODULES.length).toBeGreaterThanOrEqual(12);
    for (const m of shield.MODULES) {
      expect(["input", "output", "both"]).toContain(m.io);
      expect(shield.KIND_LABELS[m.connector], m.id).toBeTruthy();
    }
  });
});

describe("shield.matchModule", () => {
  it("сервопривід на ШІМ", () => {
    expect(shield.matchModule("servo", "pwm").ok).toBe(true);
  });
  it("LCD I2C не на аналоговий", () => {
    const r = shield.matchModule("lcd-i2c", "analog");
    expect(r.ok).toBe(false);
    expect(r.why).toBeTruthy();
  });
  it("невідомий модуль", () => {
    expect(shield.matchModule("nope", "pwm").ok).toBe(false);
  });
});

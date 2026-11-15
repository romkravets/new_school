import { describe, it, expect } from "vitest";
import { loadPage } from "../helpers/load-script.js";

describe("урок 11 · миготіння світлодіода", () => {
  it("має вкладки, бали, симулятор і посилання у футері", async () => {
    const window = await loadPage("11-boards-blink");
    const doc = window.document;
    expect(window.Lesson).toBeDefined();
    const tabs = [...doc.querySelectorAll("nav.tabs button[data-tab]")];
    expect(tabs.length).toBeGreaterThan(0);
    for (const b of tabs) {
      expect(doc.querySelector("section.panel#" + b.dataset.tab), b.dataset.tab).not.toBeNull();
    }
    expect(Number(doc.querySelector("[data-max]").textContent)).toBeGreaterThanOrEqual(4 + 5 + 1);
    expect(doc.querySelector("#sim .led")).not.toBeNull();
    const hrefs = [...doc.querySelectorAll("footer a")].map(a => a.getAttribute("href"));
    expect(hrefs).toContain("teacher.html");
    expect(hrefs).toContain("../../documents/rp/LAB_1/лаб 1.pdf");
  });
});

describe("урок 12 · макетна плата, цикл for, світлофор", () => {
  it("має вкладки, бали, схему, цикл і посилання у футері", async () => {
    const window = await loadPage("12-boards-leds-loops");
    const doc = window.document;
    const tabs = [...doc.querySelectorAll("nav.tabs button[data-tab]")];
    expect(tabs.length).toBeGreaterThan(0);
    for (const b of tabs) {
      expect(doc.querySelector("section.panel#" + b.dataset.tab), b.dataset.tab).not.toBeNull();
    }
    expect(Number(doc.querySelector("[data-max]").textContent)).toBeGreaterThanOrEqual(1 + 2 + 1 + 4);
    for (const id of ["w-anode", "w-cathode", "w-resistor"]) {
      expect(doc.querySelector("#wiring select#" + id), id).not.toBeNull();
    }
    expect(doc.querySelectorAll("#loop .led").length).toBe(3);
    const hrefs = [...doc.querySelectorAll("footer a")].map(a => a.getAttribute("href"));
    expect(hrefs).toContain("teacher.html");
    expect(hrefs).toContain("../../documents/rp/LAB_1/лаб 2.pdf");
  });
});

describe("урок 13 · Sensor Shield V5", () => {
  it("має вкладки, карту плати, бали і посилання у футері", async () => {
    const window = await loadPage("13-boards-sensor-shield");
    const doc = window.document;
    const tabs = [...doc.querySelectorAll("nav.tabs button[data-tab]")];
    expect(tabs.length).toBeGreaterThan(0);
    for (const b of tabs) {
      expect(doc.querySelector("section.panel#" + b.dataset.tab), b.dataset.tab).not.toBeNull();
    }
    expect(Number(doc.querySelector("[data-max]").textContent)).toBeGreaterThanOrEqual(12 + 12 + 3);
    expect(doc.querySelector("#map svg")).not.toBeNull();
    expect(doc.querySelectorAll("#map button[data-group]").length).toBe(window.Boards.shield.PIN_GROUPS.length);
    expect(doc.querySelectorAll("#map svg g[data-group]").length).toBe(window.Boards.shield.PIN_GROUPS.length);
    const hrefs = [...doc.querySelectorAll("footer a")].map(a => a.getAttribute("href"));
    expect(hrefs).toContain("teacher.html");
    expect(hrefs).toContain("../../documents/rp/LAB_2/лаб 1.pdf");
  });
});

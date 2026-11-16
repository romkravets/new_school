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

describe("урок 12 · завдання «Біжучий вогник»", () => {
  it("зараховує blink(i) і підказує, якщо обрано on(i)", async () => {
    const window = await loadPage("12-boards-leds-loops");
    const doc = window.document;
    const task = doc.querySelector("#l-task");
    expect([...task.options].map(o => o.textContent)).toContain("Біжучий вогник");
    const change = (el, v) => { el.value = v; el.dispatchEvent(new window.Event("change")); };
    change(task, "chaser");
    const fb = doc.querySelector("#l-fb");
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const before = score();
    doc.querySelector("#l-check").click();
    expect(fb.textContent).toContain("blink(i)");
    expect(score()).toBe(before);
    change(doc.querySelector("#l-1-body"), "blink(i)");
    doc.querySelector("#l-check").click();
    expect(fb.textContent).toContain("Завдання виконано");
    expect(score()).toBe(before + 1);
  });
});

describe("урок 14 · лабораторний день", () => {
  it("має вкладки, чекліст із заблокованою кнопкою, звіт і типові збої", async () => {
    const window = await loadPage("14-boards-lab-day");
    const doc = window.document;
    const lab = window.Boards.lab;
    const tabs = [...doc.querySelectorAll("nav.tabs button[data-tab]")];
    expect(tabs.map(b => b.dataset.tab)).toEqual(["checklist", "log", "report", "troubles", "final"]);
    for (const b of tabs) {
      expect(doc.querySelector("section.panel#" + b.dataset.tab), b.dataset.tab).not.toBeNull();
    }
    const boxes = [...doc.querySelectorAll("#checklist input[type=checkbox]")];
    expect(boxes.length).toBe(lab.CHECKLIST.length);
    const power = doc.querySelector("#power-on");
    expect(power.disabled).toBe(true);
    boxes.forEach(b => { b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true })); });
    expect(power.disabled).toBe(false);
    boxes[0].checked = false;
    boxes[0].dispatchEvent(new window.Event("change", { bubbles: true }));
    expect(power.disabled).toBe(true);
    expect(doc.querySelector("#report-out.out")).not.toBeNull();
    expect(Number(doc.querySelector("[data-max]").textContent)).toBeGreaterThanOrEqual(lab.TROUBLES.length);
    const hrefs = [...doc.querySelectorAll("footer a")].map(a => a.getAttribute("href"));
    expect(hrefs).toContain("teacher.html");
    expect(hrefs).toContain("../../documents/rp/LAB_1/лаб 1.pdf");
    expect(hrefs).toContain("../../documents/rp/LAB_1/лаб 2.pdf");
  });
  it("додає запис у журнал із часом і збирає звіт", async () => {
    const window = await loadPage("14-boards-lab-day");
    const doc = window.document;
    doc.querySelector("#log-text").value = "Підключив світлодіод";
    doc.querySelector("#log-add").click();
    expect(doc.querySelector("#log-list li").textContent).toMatch(/\d\d:\d\d.*Підключив світлодіод/);
    doc.querySelector("#rf-goal").value = "Блимати діодом";
    doc.querySelector("#report-build").click();
    expect(doc.querySelector("#report-out").textContent).toContain("Мета:");
    expect(doc.querySelector("#report-fb").textContent).toContain("Бракує");
  });
});

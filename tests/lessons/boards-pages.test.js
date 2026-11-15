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

import { describe, it, expect, afterEach } from "vitest";
import { loadPage, closePages } from "../helpers/load-script.js";

afterEach(closePages);

describe("урок 19 · таблиця істинності: показ відповідей", () => {
  it("після «Показати відповіді» перевірка не дає балів, а після скидання працює", async () => {
    const doc = (await loadPage("19-py-branching")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    const check = doc.querySelector("#truth button[data-check]");
    doc.querySelector("#truth button[data-show]").click();
    expect(check.disabled).toBe(true);
    check.click();
    doc.querySelector("#truth button[data-check]").click();
    expect(score()).toBe(0);
    doc.querySelector("#truth button[data-reset]").click();
    expect(check.disabled).toBe(false);
    for (const c of doc.querySelectorAll("#truth button[data-cell]")) {
      for (let i = 0; i < 3 && c.textContent.trim() !== c.dataset.answer; i++) c.click();
    }
    check.click();
    expect(score()).toBe(10);
  });
});

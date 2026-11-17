import { describe, it, expect, afterEach } from "vitest";
import { loadPage, closePages } from "../helpers/load-script.js";

afterEach(closePages);

describe("урок 19 · таблиця істинності: показ відповідей", () => {
  const fill = (doc) => {
    for (const c of doc.querySelectorAll("#truth button[data-cell]")) {
      for (let i = 0; i < 3 && c.textContent.trim() !== c.dataset.answer; i++) c.click();
    }
  };
  it("без показу відповідей: скидання, правильне заповнення, перевірка дає 10", async () => {
    const doc = (await loadPage("19-py-branching")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    fill(doc);
    doc.querySelector("#truth button[data-reset]").click();
    fill(doc);
    doc.querySelector("#truth button[data-check]").click();
    expect(score()).toBe(10);
  });
  it("після «Показати відповіді» таблиця безбальна навіть після скидання", async () => {
    const doc = (await loadPage("19-py-branching")).document;
    const score = () => Number(doc.querySelector("[data-score]").textContent);
    doc.querySelector("#truth button[data-show]").click();
    doc.querySelector("#truth button[data-reset]").click();
    fill(doc);
    doc.querySelector("#truth button[data-check]").click();
    expect(score()).toBe(0);
    expect(doc.querySelector("#truth .fb").textContent).toContain("Відповіді вже показано — це тренування без балів");
  });
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
    expect(score()).toBe(0);
  });
});

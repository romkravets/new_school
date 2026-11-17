import { describe, it, expect, afterEach } from "vitest";
import { loadPage, closePages } from "../helpers/load-script.js";

afterEach(closePages);

const tick = (w) => new Promise((r) => w.setTimeout(r, 0));
async function go(w, hash) { w.location.hash = hash; w.dispatchEvent(new w.HashChangeEvent("hashchange")); await tick(w); }

describe("сторінка задачника", () => {
  it("список тем з прогресом N з M", async () => {
    const w = await loadPage("taskbook/index.html");
    await go(w, "");
    expect(w.document.querySelectorAll('a[href^="#"]').length).toBeGreaterThanOrEqual(5);
    expect(w.document.body.textContent).toContain("0 з 8");
  });

  it("#branching показує всі задачі теми", async () => {
    const w = await loadPage("taskbook/index.html");
    await go(w, "#branching");
    expect(w.document.querySelectorAll('a[href^="#branching/"]').length).toBe(w.TASKBOOK.branching.length);
  });

  it("#types/<id> показує #code зі starter, вхідні дані й джерело", async () => {
    const w = await loadPage("taskbook/index.html");
    const t = w.TASKBOOK.types[0];
    await go(w, "#types/" + t.id);
    expect(w.document.getElementById("code").value).toBe(t.starter);
    expect(w.document.body.textContent).toContain("usd = 100");
    expect(w.document.getElementById("out")).toBeTruthy();
  });

  it("джерело з посиланням на Drive", async () => {
    const w = await loadPage("taskbook/index.html");
    const t = w.TASKBOOK.branching[0];
    await go(w, "#branching/" + t.id);
    const a = w.document.querySelector('a[href*="drive.google.com"]');
    expect(a).toBeTruthy();
    expect(w.document.body.textContent).toContain("Крутяк Н. О.");
  });

  it("markSolved + report", async () => {
    const w = await loadPage("taskbook/index.html");
    w.Py.taskbook.markSolved("types", w.TASKBOOK.types[0].id);
    const r = w.Py.taskbook.report();
    expect(r).toContain("Задачник: Інформатика, поглиблений рівень");
    expect(r).toContain("Розв'язано 1 з");
    expect(r).toContain(w.TASKBOOK.types[0].title);
    expect(w.Py.taskbook.progress().types[w.TASKBOOK.types[0].id]).toBe(true);
  });

  it("route", async () => {
    const w = await loadPage("taskbook/index.html");
    expect(w.Py.taskbook.route("")).toEqual({ topic: null, taskId: null });
    expect(w.Py.taskbook.route("#types")).toEqual({ topic: "types", taskId: null });
    expect(w.Py.taskbook.route("#types/x")).toEqual({ topic: "types", taskId: "x" });
  });

  it("pyLiteral", async () => {
    const w = await loadPage("taskbook/index.html");
    const p = w.Py.taskbook.pyLiteral;
    expect(p(true)).toBe("True");
    expect(p(null)).toBe("None");
    expect(p("а")).toBe("'а'");
    expect(p("it's")).toBe('"it\'s"');
    expect(p([1, "a", [false]])).toBe("[1, 'a', [False]]");
    expect(p(41.5)).toBe("41.5");
  });

  it("Перевірити: успіх ставить штамп і прогрес", async () => {
    const w = await loadPage("taskbook/index.html");
    const t = w.TASKBOOK.types[0];
    w.Py.runner.run = (code, vars) => Promise.resolve({ stdout: t.tests.find((x) => JSON.stringify(x.vars) === JSON.stringify(vars)).out, error: null, timedOut: false });
    await go(w, "#types/" + t.id);
    w.document.getElementById("check").click();
    await new Promise((r) => w.setTimeout(r, 50));
    expect(w.document.body.textContent).toContain("Зараховано");
    expect(w.Py.taskbook.progress().types[t.id]).toBe(true);
  });

  it("Перевірити: провал показує номер тесту, очікуване і підказку помилки", async () => {
    const w = await loadPage("taskbook/index.html");
    const t = w.TASKBOOK.types[0];
    let n = 0;
    w.Py.runner.run = () => Promise.resolve(++n === 1 ? { stdout: t.tests[0].out, error: null, timedOut: false } : { stdout: "", error: 'Traceback\n  File "<exec>", line 2, in <module>\nNameError: name \'q\' is not defined', timedOut: false });
    await go(w, "#types/" + t.id);
    w.document.getElementById("check").click();
    await new Promise((r) => w.setTimeout(r, 50));
    const txt = w.document.getElementById("result").textContent;
    expect(txt).toContain("Тест 2");
    expect(txt).toContain("NameError");
    expect(w.Py.taskbook.progress().types).toBeUndefined();
  });

  it("код зберігається в localStorage", async () => {
    const w = await loadPage("taskbook/index.html");
    const t = w.TASKBOOK.types[0];
    await go(w, "#types/" + t.id);
    const ta = w.document.getElementById("code");
    ta.value = "print(1)";
    ta.dispatchEvent(new w.Event("input"));
    expect(w.localStorage.getItem("taskbook-v1:code:types/" + t.id)).toBe("print(1)");
    await go(w, "#types");
    await go(w, "#types/" + t.id);
    expect(w.document.getElementById("code").value).toBe("print(1)");
  });
});

describe("стійкість", () => {
  it("зіпсований hash -> список тем", async () => {
    const w = await loadPage("taskbook/index.html");
    expect(w.Py.taskbook.route("#%E0%A4%A")).toEqual({ topic: null, taskId: null });
  });
  it("Esc звільняє Tab", async () => {
    const w = await loadPage("taskbook/index.html");
    await go(w, "#types/" + w.TASKBOOK.types[0].id);
    const ta = w.document.getElementById("code");
    const key = (k) => { const e = new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }); ta.dispatchEvent(e); return e.defaultPrevented; };
    expect(key("Tab")).toBe(true);
    key("Escape");
    expect(key("Tab")).toBe(false);
  });
  it("без Python немає «Тест 1 не пройдено»", async () => {
    const w = await loadPage("taskbook/index.html");
    w.Py.runner.isAvailable = () => false;
    w.Py.runner.run = () => Promise.resolve({ stdout: "", error: "Python не завантажився", timedOut: false });
    await go(w, "#types/" + w.TASKBOOK.types[0].id);
    w.document.getElementById("check").click();
    await new Promise((r) => w.setTimeout(r, 50));
    expect(w.document.getElementById("result").textContent).not.toContain("Тест 1");
    expect(w.document.querySelector("[data-py-status]").textContent).toContain("недоступний");
    expect(w.document.getElementById("copy-task").className).toContain("primary");
  });
});

describe("блок «Задачник» на сторінці курсу", () => {
  it("є для inf10deep, немає для boards", async () => {
    const w = await loadPage("index.html");
    await go(w, "#inf10deep");
    expect(w.document.querySelectorAll('a[href^="taskbook/index.html#"]').length).toBe(5);
    expect(w.document.querySelector('a[href="taskbook/index.html#types"]')).toBeTruthy();
    await go(w, "#boards");
    expect(w.document.querySelector('a[href^="taskbook/index.html"]')).toBeNull();
  });
});

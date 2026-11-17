import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

function setup(url) {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only", url: url || "http://localhost/" });
  loadScript(window, "assets/py/runner.js");
  return window.Py.runner;
}

function fakeFactory(behavior) {
  const workers = [];
  const create = () => {
    const w = {
      sent: [], terminated: false, onmessage: null,
      postMessage(m) { this.sent.push(m); if (behavior) behavior(w, m); },
      terminate() { this.terminated = true; },
      emit(data) { this.onmessage && this.onmessage({ data }); },
    };
    workers.push(w);
    return w;
  };
  return { create, workers };
}

describe("runner", () => {
  let R;
  beforeEach(() => { R = setup(); });

  it("повертає stdout з відповіді worker", async () => {
    const f = fakeFactory((w, m) => { if (m.code) w.emit({ id: m.id, stdout: "5\n", error: null }); });
    R.configure({ createWorker: f.create, timeoutMs: 500 });
    const p = R.run("print(5)", {});
    f.workers[0].emit({ type: "status", status: "ready" });
    const r = await p;
    expect(r).toEqual({ stdout: "5\n", error: null, timedOut: false });
  });

  it("не створює worker до першого run; передає vars", async () => {
    const f = fakeFactory((w, m) => { if (m.code) w.emit({ id: m.id, stdout: "", error: null }); });
    R.configure({ createWorker: f.create });
    expect(f.workers.length).toBe(0);
    const p = R.run("x", { x: 1 });
    f.workers[0].emit({ type: "status", status: "ready" });
    await p;
    expect(f.workers[0].sent[0]).toMatchObject({ code: "x", vars: { x: 1 } });
  });

  it("тайм-аут: terminate, timedOut, наступний run створює новий worker", async () => {
    const f = fakeFactory();
    R.configure({ createWorker: f.create, timeoutMs: 50 });
    const p = R.run("while True: pass", {});
    f.workers[0].emit({ type: "status", status: "ready" });
    const r = await p;
    expect(r.timedOut).toBe(true);
    expect(r.error).toBe(null);
    expect(f.workers[0].terminated).toBe(true);
    const p2 = R.run("1", {});
    expect(f.workers.length).toBe(2);
    f.workers[1].emit({ type: "status", status: "ready" });
    f.workers[1].emit({ id: f.workers[1].sent[0].id, stdout: "ok", error: null });
    expect((await p2).stdout).toBe("ok");
  });

  it("failed: isAvailable false, run з помилкою про Python", async () => {
    const f = fakeFactory();
    R.configure({ createWorker: f.create });
    const seen = [];
    R.onStatus((s) => seen.push(s));
    const p = R.run("1", {});
    f.workers[0].emit({ type: "status", status: "failed", message: "net" });
    const r = await p;
    expect(r.error).toContain("Python");
    expect(R.isAvailable()).toBe(false);
    expect(seen).toContain("failed");
    const r2 = await R.run("1", {});
    expect(r2.error).toContain("Python");
    expect(f.workers.length).toBe(1);
  });

  it("file: протокол — недоступно без створення worker", async () => {
    const R2 = setup("file:///tmp/index.html");
    const f = fakeFactory();
    R2.configure({ createWorker: f.create });
    expect(R2.isAvailable()).toBe(false);
    const r = await R2.run("1", {});
    expect(r.error).toContain("Python");
    expect(f.workers.length).toBe(0);
  });

  it("паралельні run ставляться в чергу по одному", async () => {
    const f = fakeFactory();
    R.configure({ createWorker: f.create, timeoutMs: 500 });
    const p1 = R.run("a", {}), p2 = R.run("b", {});
    const w = f.workers[0];
    w.emit({ type: "status", status: "ready" });
    expect(w.sent.length).toBe(1);
    w.emit({ id: w.sent[0].id, stdout: "A", error: null });
    expect((await p1).stdout).toBe("A");
    expect(w.sent.length).toBe(2);
    w.emit({ id: w.sent[1].id, stdout: "B", error: null });
    expect((await p2).stdout).toBe("B");
  });

  it("події статусу: loading, ready, running", async () => {
    const f = fakeFactory((w, m) => { if (m.code) w.emit({ id: m.id, stdout: "", error: null }); });
    R.configure({ createWorker: f.create });
    const seen = [];
    R.onStatus((s) => seen.push(s));
    const p = R.run("1", {});
    f.workers[0].emit({ type: "status", status: "loading" });
    f.workers[0].emit({ type: "status", status: "ready" });
    await p;
    expect(seen).toEqual(["loading", "ready", "running", "ready"]);
  });
});

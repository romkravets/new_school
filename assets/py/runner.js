/* Модуль runner (задачник/уроки): запуск Python у Web Worker (Pyodide) з тайм-аутом.
   Підключення:  <script src="../assets/py/runner.js"></script>  → window.Py.runner.
   worker.js шукається відносно цього скрипта (сторінки лежать на різній глибині).
   Worker створюється ліниво — під час першого run. */
(function(){
"use strict";

var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
var WORKER_URL = SCRIPT_SRC ? SCRIPT_SRC.replace(/[^\/]*$/, "") + "worker.js" : "worker.js";

var cfg = { createWorker: null, timeoutMs: 3000 };
var worker = null, ready = false, failed = false, failMsg = "";
var queue = [], current = null, nextId = 1;
var listeners = [];

function emit(status) {
  listeners.slice().forEach(function (fn) { try { fn(status); } catch (e) {} });
}

function onFile() { return window.location && window.location.protocol === "file:"; }

function isAvailable() { return !failed && !onFile(); }

function unavailable() {
  return { stdout: "", error: "Python не завантажився" + (failMsg ? " (" + failMsg + ")" : "") + ". Перевірте з'єднання з інтернетом і відкривайте сторінку через http(s), а не з файлу.", timedOut: false };
}

function makeWorker() {
  return cfg.createWorker ? cfg.createWorker() : new Worker(WORKER_URL);
}

function ensureWorker() {
  if (worker) return;
  ready = false;
  var w = makeWorker();
  worker = w;
  w.onmessage = function (ev) { if (worker === w) onMessage(ev.data || {}); };
  w.onerror = function (ev) { if (worker === w) onMessage({ type: "status", status: "failed", message: ev && ev.message }); };
}

function onMessage(m) {
  if (m.type === "status") {
    if (m.status === "failed") {
      failed = true; failMsg = m.message || ""; ready = false;
      killWorker();
      emit("failed");
      var pending = queue.splice(0);
      if (current) { pending.unshift(current); current = null; }
      pending.forEach(function (j) { clearTimeout(j.timer); j.resolve(unavailable()); });
      return;
    }
    if (m.status === "ready") { ready = true; emit("ready"); pump(); return; }
    emit(m.status);
    return;
  }
  if (current && m.id === current.id) {
    var job = current;
    current = null;
    clearTimeout(job.timer);
    job.resolve({ stdout: m.stdout || "", error: m.error || null, timedOut: false });
    emit("ready");
    pump();
  }
}

function killWorker() {
  if (worker) { try { worker.terminate(); } catch (e) {} }
  worker = null; ready = false;
}

function pump() {
  if (current || !ready || !queue.length || !worker) return;
  var job = queue.shift();
  current = job;
  emit("running");
  job.timer = setTimeout(function () { onTimeout(job); }, cfg.timeoutMs);
  worker.postMessage({ id: job.id, code: job.code, vars: job.vars });
}

function onTimeout(job) {
  if (current !== job) return;
  current = null;
  killWorker();
  job.resolve({ stdout: job.partial || "", error: null, timedOut: true });
  if (queue.length) { ensureWorker(); } // наступні запуски — на новому worker
}

function run(code, vars) {
  if (!isAvailable()) return Promise.resolve(unavailable());
  return new Promise(function (resolve) {
    queue.push({ id: nextId++, code: String(code == null ? "" : code), vars: vars || {}, resolve: resolve, timer: null });
    ensureWorker();
    pump();
  });
}

function onStatus(fn) { if (typeof fn === "function") listeners.push(fn); }

function configure(o) {
  o = o || {};
  if (o.createWorker !== undefined) cfg.createWorker = o.createWorker;
  if (o.timeoutMs !== undefined) cfg.timeoutMs = o.timeoutMs;
}

function _reset() {
  killWorker();
  if (current) clearTimeout(current.timer);
  current = null; queue = []; failed = false; failMsg = ""; listeners = [];
  cfg = { createWorker: null, timeoutMs: 3000 };
}

window.Py = window.Py || {};
window.Py.runner = { run: run, onStatus: onStatus, isAvailable: isAvailable, configure: configure, _reset: _reset };
})();

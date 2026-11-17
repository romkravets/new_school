/* Модуль runner (задачник/уроки): запуск Python у Web Worker (Pyodide) з тайм-аутом.
   Підключення:  <script src="../assets/py/runner.js"></script>  → window.Py.runner.
   worker.js шукається відносно цього скрипта (сторінки лежать на різній глибині).
   Worker створюється ліниво — під час першого run. */
(function(){
"use strict";

function findScriptSrc() {
  if (document.currentScript && document.currentScript.src) return document.currentScript.src;
  var list = document.scripts || [];
  for (var i = 0; i < list.length; i++) {
    var src = list[i].src || "";
    if (/\/runner\.js(?:[?#].*)?$/.test(src)) return src;
  }
  return "";
}
var SCRIPT_SRC = findScriptSrc();
var WORKER_URL = SCRIPT_SRC ? SCRIPT_SRC.replace(/[?#].*$/, "").replace(/[^\/]*$/, "") + "worker.js" : "";
if (!WORKER_URL && typeof console !== "undefined") console.error("Py.runner: не вдалося визначити адресу worker.js (немає document.currentScript і <script src=\".../runner.js\">).");

var cfg = { createWorker: null, timeoutMs: 3000, loadTimeoutMs: 120000 };
var loadTimer = null;
var worker = null, ready = false, failed = false, failMsg = "";
var retryable = false, retried = false; // повторна спроба лише після тайм-ауту завантаження, один раз за сторінку
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
  if (cfg.createWorker) return cfg.createWorker();
  if (!WORKER_URL) throw new Error("не знайдено адресу worker.js");
  return new Worker(WORKER_URL);
}

function fail(message, canRetry) {
  failed = true; retryable = !!canRetry && !retried; failMsg = message || ""; ready = false;
  clearTimeout(loadTimer);
  killWorker();
  emit("failed");
  var pending = queue.splice(0);
  if (current) { pending.unshift(current); current = null; }
  pending.forEach(function (j) { clearTimeout(j.timer); j.resolve(unavailable()); });
}

function ensureWorker() {
  if (worker || failed) return;
  ready = false;
  var w;
  try { w = makeWorker(); } catch (e) { fail(String(e && e.message || e)); return; }
  worker = w;
  clearTimeout(loadTimer);
  loadTimer = setTimeout(function () { if (worker === w && !ready) fail("час очікування завантаження вичерпано", true); }, cfg.loadTimeoutMs);
  w.onmessage = function (ev) { if (worker === w) onMessage(ev.data || {}); };
  w.onerror = function (ev) { if (worker === w) onMessage({ type: "status", status: "failed", message: ev && ev.message }); };
}

function onMessage(m) {
  if (m.type === "status") {
    if (m.status === "failed") { fail(m.message); return; }
    if (m.status === "ready") { ready = true; clearTimeout(loadTimer); emit("ready"); pump(); return; }
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
  clearTimeout(loadTimer);
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
  job.resolve({ stdout: "", error: null, timedOut: true });
  if (queue.length) ensureWorker(); // новий worker сам повідомить "loading"
  else emit("ready");
}

function run(code, vars) {
  if (failed && retryable && !retried && !onFile()) { retried = true; retryable = false; failed = false; failMsg = ""; }
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
  if (o.loadTimeoutMs !== undefined) cfg.loadTimeoutMs = o.loadTimeoutMs;
}

function _reset() {
  killWorker();
  if (current) clearTimeout(current.timer);
  current = null; queue = []; failed = false; failMsg = ""; retryable = false; retried = false; listeners = [];
  cfg = { createWorker: null, timeoutMs: 3000, loadTimeoutMs: 120000 };
}

window.Py = window.Py || {};
window.Py.runner = { run: run, onStatus: onStatus, isAvailable: isAvailable, configure: configure, _reset: _reset };
})();

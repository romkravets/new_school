/* Контролер сторінки задачника: маршрути за hash, редактор, перевірка тестів, прогрес у localStorage.
   Підключення: після data/taskbook/*.js, compare.js, errors.js, runner.js. Експортує window.Py.taskbook. */
(function(){
"use strict";

var STORE = "taskbook-v1";
var CODE_PREFIX = "taskbook-v1:code:";
var DRIVE = "https://drive.google.com/drive/folders/1qpZHOUMd7iV9WaODVtEMTdoILfQ0aWld";
var Py = window.Py = window.Py || {};
var runner = Py.runner, compare = Py.compare, errors = Py.errors;

var app = null;
var statusText = "";
var checkToken = 0;

/* ---------- сховище ---------- */
function progress() {
  try {
    var v = JSON.parse(window.localStorage.getItem(STORE) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch (e) { return {}; }
}
function markSolved(topic, id) {
  var p = progress();
  if (!p[topic] || typeof p[topic] !== "object") p[topic] = {};
  p[topic][id] = true;
  try { window.localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) {}
}
function loadCode(key) { try { return window.localStorage.getItem(CODE_PREFIX + key); } catch (e) { return null; } }
function saveCode(key, v) { try { window.localStorage.setItem(CODE_PREFIX + key, v); } catch (e) {} }

/* ---------- дані ---------- */
function topics() { return window.TASKBOOK_INDEX || []; }
function tasksOf(topic) { return (window.TASKBOOK && window.TASKBOOK[topic]) || []; }
function solvedCount(topic) {
  var done = progress()[topic] || {};
  return tasksOf(topic).filter(function (t) { return done[t.id] === true; }).length;
}
function route(hash) {
  var parts = String(hash || "").replace(/^#/, "").split("/");
  try {
    var topic = parts[0] ? decodeURIComponent(parts[0]) : null;
    var taskId = topic && parts[1] ? decodeURIComponent(parts.slice(1).join("/")) : null;
    return { topic: topic, taskId: taskId };
  } catch (e) { return { topic: null, taskId: null }; }
}
function report() {
  var p = progress(), total = 0, done = 0, lines = [];
  topics().forEach(function (tp) {
    var tasks = tasksOf(tp.id), solved = tasks.filter(function (t) { return (p[tp.id] || {})[t.id] === true; });
    total += tasks.length; done += solved.length;
    lines.push(tp.title + " (" + solved.length + " з " + tasks.length + "): " + (solved.length ? solved.map(function (t) { return t.title; }).join(", ") : "—"));
  });
  return ["Задачник: Інформатика, поглиблений рівень", "Розв'язано " + done + " з " + total].concat(lines).join("\n");
}

/* ---------- Python-літерали ---------- */
function pyStr(s) {
  var q = s.indexOf("'") >= 0 && s.indexOf('"') < 0 ? '"' : "'";
  var body = s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  if (q === "'") body = body.replace(/'/g, "\\'");
  return q + body + q;
}
function pyLiteral(v) {
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null || v === undefined) return "None";
  if (typeof v === "string") return pyStr(v);
  if (typeof v === "number") return isFinite(v) ? JSON.stringify(v) : "float('" + v + "')";
  if (Array.isArray(v)) return "[" + v.map(pyLiteral).join(", ") + "]";
  if (typeof v === "object") return "{" + Object.keys(v).map(function (k) { return pyStr(k) + ": " + pyLiteral(v[k]); }).join(", ") + "}";
  return String(v);
}
function varsLines(vars) {
  return Object.keys(vars || {}).map(function (k) { return k + " = " + pyLiteral(vars[k]); }).join("\n");
}

/* ---------- DOM ---------- */
function el(tag, attrs, kids) {
  var n = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    if (k === "text") n.textContent = attrs[k];
    else if (k === "class") n.className = attrs[k];
    else n.setAttribute(k, attrs[k]);
  });
  (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return n;
}
function inlineNodes(text, into) {
  text.split("`").forEach(function (part, i) {
    if (!part) return;
    if (i % 2 === 1) { into.appendChild(el("code", { text: part })); return; }
    part.split("**").forEach(function (seg, j) {
      if (!seg) return;
      into.appendChild(j % 2 === 1 ? el("strong", { text: seg }) : document.createTextNode(seg));
    });
  });
}
function renderText(text) {
  var box = el("div", { class: "statement" });
  String(text).split("```").forEach(function (seg, i) {
    if (i % 2 === 1) box.appendChild(el("pre", { text: seg.replace(/^\n/, "").replace(/\n$/, "") }));
    else inlineNodes(i > 0 ? seg.replace(/^\n/, "") : seg, box);
  });
  return box;
}
function button(text, id, cls) { return el("button", { type: "button", id: id, class: "btn" + (cls ? " " + cls : ""), text: text }); }

function copyText(text, onDone) {
  function fallback() {
    var ta = el("textarea", { "aria-hidden": "true" });
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    onDone(ok);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback);
  else fallback();
}

/* ---------- статус Python ---------- */
var STATUS = {
  loading: "Завантажую Python (≈10 МБ, лише перший раз)…",
  ready: "Python готовий",
  running: "Виконую…",
  failed: "Python недоступний — скопіюй умову й розв'яжи в ЄPython або Colab"
};
function setStatus(s) {
  statusText = STATUS[s] || "";
  paintStatus();
}
function paintStatus() {
  var unavailable = runner && !runner.isAvailable();
  var node = document.querySelector("[data-py-status]");
  if (node) node.textContent = unavailable ? STATUS.failed : statusText;
  var copy = document.getElementById("copy-task"), check = document.getElementById("check");
  if (copy && check) {
    copy.classList.toggle("primary", !!unavailable);
    check.classList.toggle("primary", !unavailable);
  }
}

/* ---------- екрани ---------- */
function viewTopics() {
  app.textContent = "";
  var box = el("section", { class: "paper" }, [el("h2", { text: "Теми" })]);
  var ul = el("ul", { class: "topics" });
  topics().forEach(function (tp) {
    var n = tasksOf(tp.id).length;
    ul.appendChild(el("li", {}, [el("a", { class: "topic-link", href: "#" + tp.id }, [
      el("span", { text: tp.title }), el("span", { class: "badge", text: solvedCount(tp.id) + " з " + n })
    ])]));
  });
  box.appendChild(ul);
  var fb = el("span", { class: "status", role: "status" });
  var btn = button("Скопіювати звіт", "copy-report");
  btn.addEventListener("click", function () {
    copyText(report(), function (ok) { fb.textContent = ok ? "Звіт скопійовано." : "Браузер не дозволив копіювати."; });
  });
  box.appendChild(el("div", { class: "row" }, [btn, fb]));
  app.appendChild(box);
}

function viewTopic(topic) {
  var tp = topics().filter(function (t) { return t.id === topic; })[0];
  if (!tp) return viewTopics();
  app.textContent = "";
  var done = progress()[topic] || {};
  var box = el("section", { class: "paper" }, [
    el("a", { class: "back", href: "#", text: "← До тем" }),
    el("h2", { text: tp.title }),
    el("p", { class: "tb-hint-line", text: "Розв'язано " + solvedCount(topic) + " з " + tasksOf(topic).length })
  ]);
  var ul = el("ul", { class: "tasks" });
  tasksOf(topic).forEach(function (t) {
    var ok = done[t.id] === true;
    ul.appendChild(el("li", {}, [el("a", { class: "task-link" + (ok ? " solved" : ""), href: "#" + topic + "/" + t.id }, [
      el("span", { text: (t.emoji ? t.emoji + " " : "") + t.title }), el("span", { class: "badge", text: ok ? "✓" : "—" })
    ])]));
  });
  box.appendChild(ul);
  app.appendChild(box);
}

function viewTask(topic, taskId) {
  var tasks = tasksOf(topic), idx = -1;
  tasks.forEach(function (t, i) { if (t.id === taskId) idx = i; });
  if (idx < 0) return viewTopic(topic);
  var task = tasks[idx], key = topic + "/" + task.id;
  app.textContent = "";

  var card = el("section", { class: "paper" });
  card.appendChild(el("a", { class: "back", href: "#" + topic, text: "← До теми" }));
  card.appendChild(el("h2", { text: (task.emoji ? task.emoji + " " : "") + task.title }));
  card.appendChild(renderText(task.text));
  if (task.source) {
    card.appendChild(el("p", { class: "source" }, [
      "Задача: " + task.source.author + " (ноутбук «" + String(task.source.ref) + "») — ",
      el("a", { href: DRIVE, target: "_blank", rel: "noopener", text: "папка з ноутбуками" })
    ]));
  }
  var lines = varsLines(task.vars);
  card.appendChild(el("h3", { text: "Вхідні дані" }));
  card.appendChild(el("pre", { id: "vars", text: lines }));
  app.appendChild(card);

  var work = el("section", { class: "paper" });
  work.appendChild(el("h3", { text: "Твій код" }));
  var ta = el("textarea", { id: "code", spellcheck: "false", "aria-label": "Код Python" });
  var saved = loadCode(key);
  ta.value = saved != null ? saved : (task.starter || "");
  work.appendChild(ta);
  work.appendChild(el("p", { class: "source", text: "Tab — відступ 4 пробіли. Esc, потім Tab — вийти з поля." }));
  work.appendChild(el("p", { class: "status", "data-py-status": "", role: "status" }));
  var bRun = button("Запустити", "run"), bCheck = button("Перевірити", "check", "primary");
  var bHint = button("Підказка", "hint-btn"), bReset = button("Скинути до заготовки", "reset");
  var bCopy = button("Скопіювати умову й дані", "copy-task");
  work.appendChild(el("div", { class: "row" }, [bCheck, bRun, bHint, bCopy, bReset]));
  var hintBox = el("div", { class: "hintbox", hidden: "" });
  hintBox.hidden = true;
  hintBox.appendChild(renderText(task.hint || "Підказки немає."));
  work.appendChild(hintBox);
  work.appendChild(el("h3", { text: "Вивід" }));
  var out = el("pre", { id: "out" });
  work.appendChild(out);
  var result = el("div", { id: "result", "aria-live": "polite" });
  work.appendChild(result);
  var prev = idx > 0 ? tasks[idx - 1] : null, next = idx < tasks.length - 1 ? tasks[idx + 1] : null;
  var nav = el("div", { class: "row" }, [
    prev ? el("a", { class: "btn", id: "prev", href: "#" + topic + "/" + prev.id, text: "Попередня" }) : null,
    el("a", { class: "btn", href: "#" + topic, text: "← До теми" }),
    next ? el("a", { class: "btn", id: "next", href: "#" + topic + "/" + next.id, text: "Наступна" }) : null
  ]);
  work.appendChild(nav);
  app.appendChild(work);

  var busy = false;
  function setBusy(b) { busy = b; [bRun, bCheck, bReset].forEach(function (x) { x.disabled = b; }); }

  ta.addEventListener("input", function () { saveCode(key, ta.value); });
  var trapOff = false;
  ta.addEventListener("focus", function () { trapOff = false; });
  ta.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { trapOff = true; return; }
    if (e.key !== "Tab") trapOff = false;
    if (e.key === "Tab" && !trapOff && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end");
      saveCode(key, ta.value);
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!busy) doRun();
    }
  });
  bHint.addEventListener("click", function () { hintBox.hidden = !hintBox.hidden; });
  bReset.addEventListener("click", function () {
    ta.value = task.starter || ""; saveCode(key, ta.value); out.textContent = ""; result.textContent = "";
  });
  bCopy.addEventListener("click", function () {
    var text = task.title + "\n\n" + task.text + "\n\nВхідні дані:\n" + lines + "\n";
    copyText(text, function (ok) {
      result.textContent = "";
      result.appendChild(el("p", { class: "status", text: ok ? "Умову й дані скопійовано." : "Браузер не дозволив копіювати. Виділи текст і скопіюй вручну." }));
    });
  });

  function doRun() {
    setBusy(true); result.textContent = "";
    runner.run(ta.value, task.vars).then(function (r) {
      out.textContent = r.timedOut ? "" : (r.stdout || "");
      if (!runner.isAvailable()) paintStatus();
      else if (r.timedOut) result.appendChild(el("div", { class: "result bad" }, [el("p", { text: "Програма виконується надто довго (понад 3 секунди) — схоже на нескінченний цикл. Перевір умову виходу з циклу." })]));
      else if (r.error) result.appendChild(errorBox(r.error));
    }).then(function () { setBusy(false); }, function () { setBusy(false); });
  }
  function errorBox(err) {
    var box = el("div", { class: "result bad" });
    if (!runner.isAvailable()) { box.appendChild(el("p", { text: err })); return box; }
    box.appendChild(el("pre", { text: errors.clean(err) }));
    box.appendChild(el("p", { text: errors.hint(err).text }));
    return box;
  }
  bRun.addEventListener("click", doRun);

  bCheck.addEventListener("click", function () {
    if (busy) return;
    setBusy(true); result.textContent = ""; out.textContent = "";
    var code = ta.value, i = 0, token = ++checkToken;
    function fail(ti, r, why) {
      if (!runner.isAvailable()) { paintStatus(); setBusy(false); return; }
      var test = task.tests[ti];
      var box = el("div", { class: "result bad" }, [
        el("h3", { text: "Тест " + (ti + 1) + " з " + task.tests.length + " не пройдено" }),
        el("p", { text: "Вхідні дані цього тесту:" }),
        el("pre", { text: varsLines(test.vars) })
      ]);
      if (why === "timeout") {
        box.appendChild(el("p", { text: "Програма виконується надто довго (понад 3 секунди) — схоже на нескінченний цикл. Перевір умову виходу з циклу." }));
      } else if (why === "error") {
        box.appendChild(errorBox(r.error));
      } else {
        box.appendChild(el("p", { text: "Очікувалось:" })); box.appendChild(el("pre", { text: test.out }));
        box.appendChild(el("p", { text: "Отримано:" })); box.appendChild(el("pre", { text: r.stdout }));
        box.appendChild(el("p", { text: compare.explainMismatch(task, ti, r) }));
      }
      result.appendChild(box);
      setBusy(false);
    }
    function step() {
      if (token !== checkToken) return;
      if (i >= task.tests.length) {
        markSolved(topic, task.id);
        result.appendChild(el("div", { class: "result ok" }, [
          el("span", { class: "stamp", text: "Зараховано" }),
          el("p", { text: "Усі " + task.tests.length + " тестів пройдено." })
        ]));
        setBusy(false);
        return;
      }
      var ti = i;
      runner.run(code, task.tests[ti].vars).then(function (r) {
        if (token !== checkToken) return;
        if (!runner.isAvailable()) return fail(ti, r, "error");
        if (r.timedOut) return fail(ti, r, "timeout");
        if (r.error) return fail(ti, r, "error");
        if (!compare.compareOutput(task.tests[ti].out, r.stdout, task.tolerance).ok) return fail(ti, r, "diff");
        i++; step();
      }, function () { setBusy(false); });
    }
    step();
  });
  paintStatus();
}

function render() {
  if (!app) return;
  checkToken++;
  var r = route(window.location.hash);
  if (!r.topic) viewTopics();
  else if (!r.taskId) viewTopic(r.topic);
  else viewTask(r.topic, r.taskId);
  paintStatus();
}

Py.taskbook = { route: route, progress: progress, markSolved: markSolved, report: report, pyLiteral: pyLiteral, render: render };

function init() {
  app = document.getElementById("app");
  if (runner) runner.onStatus(setStatus);
  window.addEventListener("hashchange", render);
  render();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

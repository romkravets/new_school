/* Модуль compare (задачник): порівняння виводу програми з очікуваним.
   Підключення:  <script src="../assets/py/compare.js"></script>  (працює і в Node через vm з об'єктом window).
   Правила: порядково; кінцеві пробіли рядка й порожні рядки наприкінці ігноруються; пробіли всередині рядка значущі;
   tolerance діє на кожен числовий токен окремо. */
(function(){
"use strict";

function normalize(text) {
  var lines = String(text == null ? "" : text).replace(/\r\n?/g, "\n").split("\n").map(function (l) { return l.replace(/\s+$/, ""); });
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

var NUM = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function lineEqual(a, b, tol) {
  if (a === b) return true;
  if (!tol) return false;
  var ta = a.split(/(\s+)/), tb = b.split(/(\s+)/);
  if (ta.length !== tb.length) return false;
  for (var i = 0; i < ta.length; i++) {
    if (ta[i] === tb[i]) continue;
    if (NUM.test(ta[i]) && NUM.test(tb[i]) && Math.abs(parseFloat(ta[i]) - parseFloat(tb[i])) <= tol) continue;
    return false;
  }
  return true;
}

function compareOutput(expected, actual, tolerance) {
  var e = normalize(expected), a = normalize(actual);
  var n = Math.max(e.length, a.length);
  for (var i = 0; i < n; i++) {
    var le = i < e.length ? e[i] : null, la = i < a.length ? a[i] : null;
    if (le === null || la === null || !lineEqual(le, la, tolerance)) {
      return { ok: false, line: i + 1, expected: le, actual: la };
    }
  }
  return { ok: true, line: null, expected: null, actual: null };
}

/* result: { stdout: string, error: string|null } — те, що повернув runner для цього тесту.
   test — елемент task.tests; task.tests[0] — видимий приклад. */
function explainMismatch(task, test, result) {
  var tests = (task && task.tests) || [];
  var idx = tests.indexOf(test);
  var stdout = result && result.stdout != null ? result.stdout : "";
  if (idx > 0 && tests[0] && compareOutput(tests[0].out, stdout).ok) {
    return "Твоя програма друкує те саме, що й на прикладі. Можливо, ти задаєш дані вручну — не перезаписуй змінні з «Вхідних даних».";
  }
  return "Тест " + (idx >= 0 ? idx + 1 : "?") + " не пройдено: вивід не збігається з очікуваним.";
}

window.Py = window.Py || {};
window.Py.compare = { normalize: normalize, compareOutput: compareOutput, explainMismatch: explainMismatch };
})();

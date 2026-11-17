/* Модуль range (урок 25): послідовність range(...) як список чисел.
   Підключення:  <script src="../../assets/py/range.js"></script>  → window.Py.range
   Форми: values(stop), values(start, stop), values(start, stop, step). Понад 1000 елементів → {error:"TooLong"}. */
(function(){
"use strict";

var MAX = 1000;

function isInt(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; }

function norm(start, stop, step) {
  if (stop === null || stop === undefined) { stop = start; start = 0; }
  if (step === null || step === undefined) step = 1;
  return { start: start, stop: stop, step: step };
}

function values(start, stop, step) {
  var r = norm(start, stop, step);
  if (!isInt(r.start) || !isInt(r.stop) || !isInt(r.step)) return { error: "TypeError" };
  if (r.step === 0) return { error: "ValueError" };
  var n = Math.max(0, Math.ceil((r.stop - r.start) / r.step));
  if (n > MAX) return { error: "TooLong" };
  var out = [];
  for (var i = 0; i < n; i++) out.push(r.start + i * r.step);
  return out;
}

function describe(start, stop, step) {
  var r = norm(start, stop, step);
  if (r.step === 0) return "крок 0 неможливий: ValueError";
  var vals = values(r.start, r.stop, r.step);
  var text = "від " + r.start + " до " + r.stop + " (не включно) з кроком " + String(r.step).replace("-", "−");
  if (!Array.isArray(vals) && vals.error === "TypeError") return "range приймає лише цілі числа: TypeError";
  if (Array.isArray(vals) && !vals.length) text += " — порожня послідовність";
  return text;
}

window.Py = window.Py || {};
window.Py.range = { values: values, describe: describe, MAX: MAX };
})();

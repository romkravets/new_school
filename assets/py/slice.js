/* Модуль slice (уроки 21–22): семантика індексів і зрізів Python (як у CPython).
   Підключення:  <script src="../../assets/py/slice.js"></script>  → window.Py.slice
   null/undefined у start/stop/step = «пропущено». Працює зі списками (масивами) і рядками. */
(function(){
"use strict";

function isOmitted(x) { return x === null || x === undefined; }
function isInt(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; }
function isStr(s) { return typeof s === "string"; }

// Те саме, що slice(start, stop, step).indices(len) у CPython; step уже ненульовий.
function resolve(len, start, stop, step) {
  var lower = step < 0 ? -1 : 0, upper = step < 0 ? len - 1 : len;
  function clamp(v, dflt) {
    if (isOmitted(v)) return dflt;
    if (v < 0) { v += len; if (v < lower) v = lower; }
    else if (v > upper) v = upper;
    return v;
  }
  return { start: clamp(start, step < 0 ? upper : lower), stop: clamp(stop, step < 0 ? lower : upper) };
}

function slice(list, start, stop, step) {
  if (isOmitted(step)) step = 1;
  if (step === 0) return { error: "ValueError" };
  var str = isStr(list), src = str ? list.split("") : list, out = [];
  var r = resolve(src.length, start, stop, step);
  if (step > 0) for (var i = r.start; i < r.stop; i += step) out.push(src[i]);
  else for (var j = r.start; j > r.stop; j += step) out.push(src[j]);
  return str ? out.join("") : out;
}

function index(list, i) {
  var n = list.length, k = i < 0 ? i + n : i;
  if (!isInt(i) || k < 0 || k >= n) return { ok: false, error: "IndexError" };
  return { ok: true, value: list[k] };
}

var INT = /^-?\d+$/;
var NAME = /^[\p{L}_][\p{L}\p{N}_]*$/u;

// Лише розбір тексту, жодного eval.
function parse(expr) {
  if (typeof expr !== "string") return null;
  var m = /^\s*([^\[\]\s]+)\s*\[([^\[\]]*)\]\s*$/.exec(expr);
  if (!m || !NAME.test(m[1])) return null;
  var parts = m[2].split(":").map(function (p) { return p.trim(); });
  if (parts.length === 1) {
    return INT.test(parts[0]) ? { kind: "index", i: parseInt(parts[0], 10), name: m[1] } : null;
  }
  if (parts.length > 3) return null;
  var v = [];
  for (var k = 0; k < 3; k++) {
    var p = parts[k];
    if (p === undefined || p === "") v.push(null);
    else if (INT.test(p)) v.push(parseInt(p, 10));
    else return null;
  }
  return { kind: "slice", start: v[0], stop: v[1], step: v[2], name: m[1] };
}

// Мінімальний запис: step 1 і порожні частини не виводяться.
function toExpr(sl, name) {
  var s = isOmitted(sl.start) ? "" : String(sl.start);
  var e = isOmitted(sl.stop) ? "" : String(sl.stop);
  var out = s + ":" + e;
  if (!isOmitted(sl.step) && sl.step !== 1) out += ":" + sl.step;
  return (name || "a") + "[" + out + "]";
}

window.Py = window.Py || {};
window.Py.slice = { index: index, slice: slice, parse: parse, toExpr: toExpr };
})();

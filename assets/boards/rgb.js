/* Модуль rgb (урок 15): RGB-світлодіод, ШІМ і змішування кольорів.
   Підключення:  <script src="../../assets/boards/rgb.js"></script>
   Дані з лабораторної: спільний катод, R → пін 6, G → пін 3, B → пін 5, 220 Ом на канал, analogWrite(пін, 0..255). */
(function(){
"use strict";

var PINS = { r: 6, g: 3, b: 5 };
var TOLERANCE = 40;
var TARGETS = [
  { id: "orange", name: "Оранжевий", value: { r: 255, g: 128, b: 0 } },
  { id: "yellow", name: "Жовтий", value: { r: 255, g: 255, b: 0 } },
  { id: "cyan", name: "Блакитний", value: { r: 0, g: 255, b: 255 } },
  { id: "violet", name: "Фіолетовий", value: { r: 128, g: 0, b: 255 } },
  { id: "white", name: "Білий", value: { r: 255, g: 255, b: 255 } }
];
var WORDS = { r: ["червоного"], g: ["зеленого"], b: ["синього"] };
var CHANNELS = ["r", "g", "b"];

function clamp(v){
  var n = typeof v === "number" ? v : parseFloat(v);
  if (!isFinite(n)) return 0;
  return Math.min(255, Math.max(0, Math.round(n)));
}

function clampColor(c){
  c = c || {};
  return { r: clamp(c.r), g: clamp(c.g), b: clamp(c.b) };
}

function toCss(c){
  c = clampColor(c);
  return "rgb(" + c.r + ", " + c.g + ", " + c.b + ")";
}

function toSketch(c){
  c = clampColor(c);
  return CHANNELS.map(function(k){ return "analogWrite(" + PINS[k] + ", " + c[k] + ");"; }).join("\n");
}

function matches(target, value){
  var t = clampColor(target.value), v = clampColor(value);
  return CHANNELS.every(function(k){ return Math.abs(t[k] - v[k]) <= TOLERANCE; });
}

function hint(target, value){
  var t = clampColor(target.value), v = clampColor(value);
  var parts = [];
  CHANNELS.forEach(function(k){
    var diff = t[k] - v[k];
    if (Math.abs(diff) > TOLERANCE) parts.push((diff > 0 ? "більше " : "менше ") + WORDS[k][0]);
  });
  if (!parts.length) return "";
  var text = parts.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dutyCycle(v){
  var ratio = clamp(v) / 255;
  return { ratio: ratio, percent: Math.round(ratio * 100) + " %" };
}

window.Boards = window.Boards || {};
window.Boards.rgb = { PINS: PINS, TOLERANCE: TOLERANCE, TARGETS: TARGETS, clamp: clamp,
  toCss: toCss, toSketch: toSketch, matches: matches, hint: hint, dutyCycle: dutyCycle };
})();

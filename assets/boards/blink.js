/* Модуль blink (урок 11): симулятор миготіння світлодіода і лінтер скетчу.
   Підключення:  <script src="../../assets/boards/blink.js"></script>
   Дані скетчів — з лаби 1: вбудований світлодіод на піні 13, затримка 1000 мс,
   Serial.begin(9600), лічильник у loop(). */
(function(){
"use strict";

var MAX_EVENTS = 2000;
var ERR_DELAY = "Затримка має бути додатним числом у мілісекундах.";

function validDelay(v){ return typeof v === "number" && isFinite(v) && v > 0; }

// Події {t, state}: світлодіод вмикається в t=0 і далі чергує on/off до durationMs.
function simulate(opts){
  opts = opts || {};
  var onMs = opts.onMs, offMs = opts.offMs;
  var dur = opts.durationMs === undefined ? 5000 : opts.durationMs;
  if (!validDelay(onMs) || !validDelay(offMs) || !validDelay(dur)) {
    return { events: [], error: ERR_DELAY };
  }
  var events = [], t = 0, state = 1;
  while (t <= dur && events.length < MAX_EVENTS) {
    events.push({ t: t, state: state });
    t += state ? onMs : offMs;
    state = state ? 0 : 1;
  }
  return { events: events };
}

// Період миготіння менше 40 мс (понад 25 разів/с) око вже не розрізняє.
function isFlickerVisible(periodMs){ return periodMs >= 40; }

var MESSAGES = {
  "no-pinmode": "Немає pinMode(13, OUTPUT) у setup(): пін не налаштований як вихід, світлодіод не загориться.",
  "wrong-pinmode": "Пін 13 має бути виходом: pinMode(13, OUTPUT). Режим INPUT не керує світлодіодом.",
  "same-state-twice": "Двічі поспіль digitalWrite з однаковим рівнем: світлодіод ніколи не змінить стан, миготіння не буде.",
  "missing-semicolon": "Після виклику функції пропущено крапку з комою (;) наприкінці рядка.",
  "serial-before-begin": "Serial.println викликано до Serial.begin(9600): порт ще не відкритий, текст не з'явиться."
};

// Порядковий лінтер. Повертає [{code, line}], line з 1.
function lintSketch(sketch){
  var lines = String(sketch).split("\n");
  var issues = [];
  var setupLine = 0, firstWrite = 0, hasPinMode = false;
  var beginLine = 0, lastWrite = null;

  lines.forEach(function(raw, i){
    var n = i + 1;
    var s = raw.replace(/\/\/.*$/, "").trim();
    if (!s) return;

    if (/^void\s+setup\s*\(\s*\)\s*\{/.test(s) && !setupLine) setupLine = n;

    var pm = /^pinMode\s*\(([^)]*)\)/.exec(s);
    if (pm) {
      hasPinMode = true;
      if (!/^\s*13\s*,\s*OUTPUT\s*$/.test(pm[1])) issues.push({ code: "wrong-pinmode", line: n });
    }

    var dw = /^digitalWrite\s*\(\s*13\s*,\s*(HIGH|LOW)\s*\)/.exec(s);
    if (dw) {
      if (!firstWrite) firstWrite = n;
      if (lastWrite === dw[1]) issues.push({ code: "same-state-twice", line: n });
      lastWrite = dw[1];
    }

    if (/^Serial\.begin\s*\(/.test(s)) { if (!beginLine) beginLine = n; }
    else if (/^Serial\.println\s*\(/.test(s) && !beginLine) {
      issues.push({ code: "serial-before-begin", line: n });
    }

    if (/\([^)]*\)/.test(s) && !/[;{}]$/.test(s)) issues.push({ code: "missing-semicolon", line: n });
  });

  if (!hasPinMode && (setupLine || firstWrite)) {
    issues.push({ code: "no-pinmode", line: setupLine || firstWrite });
  }
  return issues.sort(function(a, b){ return a.line - b.line; });
}

// Збирає скетч з рядків (щоб номери рядків у expected було легко звірити).
function sk(arr){ return arr.join("\n") + "\n"; }

var GOOD = [
  "int counter = 0;",                 // 1
  "",                                 // 2
  "void setup() {",                   // 3
  "  Serial.begin(9600);",            // 4
  "  pinMode(13, OUTPUT);",           // 5
  "}",                                // 6
  "",                                 // 7
  "void loop() {",                    // 8
  "  digitalWrite(13, HIGH);",        // 9
  "  delay(1000);",                   // 10
  "  digitalWrite(13, LOW);",         // 11
  "  delay(1000);",                   // 12
  "  counter++;",                     // 13
  "  Serial.println(counter);",       // 14
  "}"                                 // 15
];

function variant(edit){ var a = GOOD.slice(); edit(a); return sk(a); }

var SKETCHES = [
  { title: "Коректний скетч (лаба 1, завдання 1)", code: sk(GOOD), expected: [] },
  { title: "Немає pinMode",
    code: variant(function(a){ a.splice(4, 1); }),               // прибрано рядок 5
    expected: [{ code: "no-pinmode", line: 3 }] },
  { title: "pinMode(13, INPUT) замість OUTPUT",
    code: variant(function(a){ a[4] = "  pinMode(13, INPUT);"; }),
    expected: [{ code: "wrong-pinmode", line: 5 }] },
  { title: "Двічі HIGH поспіль",
    code: variant(function(a){ a[10] = "  digitalWrite(13, HIGH);"; }),
    expected: [{ code: "same-state-twice", line: 11 }] },
  { title: "Пропущено крапку з комою після delay",
    code: variant(function(a){ a[9] = "  delay(1000)"; }),
    expected: [{ code: "missing-semicolon", line: 10 }] },
  { title: "Serial.println до Serial.begin",
    code: variant(function(a){ a.splice(3, 0, "  Serial.println(\"Старт\");"); }),
    expected: [{ code: "serial-before-begin", line: 4 }] }
];

window.Boards = window.Boards || {};
window.Boards.blink = {
  simulate: simulate,
  isFlickerVisible: isFlickerVisible,
  lintSketch: lintSketch,
  SKETCHES: SKETCHES,
  MESSAGES: MESSAGES
};
})();

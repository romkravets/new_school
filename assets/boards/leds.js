/* Модуль leds (урок 12): перевірка схеми світлодіода, конструктор циклу for, світлофор.
   Підключення:  <script src="../../assets/boards/leds.js"></script>
   Дані з лаби 2: світлофор — червоний 7, жовтий 6, зелений 5; один світлодіод на піні 5; резистор 220 Ом. */
(function(){
"use strict";

var MAX_ITER = 50;
var PINS = { red: 7, yellow: 6, green: 5 };

function checkWiring(w){
  w = w || {};
  var problems = [];
  var reversed = w.anode === "gnd" && w.cathode === "pin5";
  if (reversed) {
    problems.push("reversed");
  } else {
    if (w.anode !== "pin5") problems.push("anode-not-pin");
    if (w.anode === "5v" && w.resistor === "none") problems.push("direct-5v");
    if (w.cathode !== "gnd") problems.push("cathode-not-gnd");
  }
  if (w.resistor !== "anode" && w.resistor !== "cathode") problems.push("no-resistor");
  return { ok: problems.length === 0, problems: problems };
}

var CONDS = {
  "<3": function(i){ return i < 3; },
  "<=2": function(i){ return i <= 2; },
  "<=3": function(i){ return i <= 3; },
  ">=0": function(i){ return i >= 0; },
  ">0": function(i){ return i > 0; }
};
var STEPS = {
  "i++": function(i){ return i + 1; },
  "i--": function(i){ return i - 1; },
  "i+=2": function(i){ return i + 2; }
};

function runLoops(loops){
  var events = [], problems = [], iterations = 0, infinite = false;
  (loops || []).forEach(function(l){
    var has = Object.prototype.hasOwnProperty;
    var cond = has.call(CONDS, l.cond) ? CONDS[l.cond] : null;
    var step = has.call(STEPS, l.step) ? STEPS[l.step] : null;
    if (!cond || !step) return;
    var i = l.start, n = 0;
    while (cond(i)) {
      if (n >= MAX_ITER) { infinite = true; break; }
      var ev = { i: i };
      if (i < 0 || i > 2) {
        ev.missing = true;
        if (problems.indexOf("index-out-of-range") < 0) problems.push("index-out-of-range");
      }
      events.push(ev);
      n++; iterations++;
      i = step(i);
    }
  });
  return { events: events, iterations: iterations, infinite: infinite, problems: problems };
}

var TASKS = [
  { id: "all", title: "Увімкнути всі три по черзі", accept: [[0, 1, 2]] },
  /* body — обов'язкове тіло кожного циклу: вогник біжить, лише коли світлодіод гасне перед наступним. */
  { id: "chaser", title: "Біжучий вогник", accept: [[0, 1, 2]], body: "blink(i)" },
  { id: "bounce", title: "Туди-назад", accept: [[0, 1, 2, 1, 0], [0, 1, 2, 2, 1, 0]] }
];

function checkTask(taskId, events, loops){
  var task = null;
  TASKS.forEach(function(t){ if (t.id === taskId) task = t; });
  if (!task) return false;
  if (task.body) {
    if (!loops || !loops.length) return false;
    if (!loops.every(function(l){ return l.body === task.body; })) return false;
  }
  var s = (events || []).filter(function(e){ return !e.missing; }).map(function(e){ return e.i; });
  return task.accept.some(function(a){
    return a.length === s.length && a.every(function(v, k){ return v === s[k]; });
  });
}

function trafficLightSteps(){
  return [
    { id: "green", text: "Світить зелений 3 секунди", seconds: 3 },
    { id: "green-blink", text: "Блимає зелений 3 рази", seconds: 3 },
    { id: "yellow", text: "Світить жовтий 3 секунди", seconds: 3 },
    { id: "red", text: "Світить червоний 3 секунди", seconds: 3 },
    { id: "red-yellow", text: "Світять червоний і жовтий разом 1 секунду", seconds: 1 }
  ];
}

window.Boards = window.Boards || {};
window.Boards.leds = {
  PINS: PINS, TASKS: TASKS,
  checkWiring: checkWiring, runLoops: runLoops, checkTask: checkTask,
  trafficLightSteps: trafficLightSteps
};
})();

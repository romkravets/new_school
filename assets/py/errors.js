/* Модуль errors (задачник): зрозумілі підказки до помилок Python.
   hint(traceback) → { type, line, text }; line — з останнього  File "<exec>", line N  (або null). */
(function(){
"use strict";

var TEXTS = {
  NameError: function (m) {
    var n = /name '([^']+)'/.exec(m);
    return n ? "Ім'я «" + n[1] + "» не визначене: перевір написання або створи змінну до її використання." : "Використано ім'я, якого ще немає: перевір написання змінної.";
  },
  TypeError: function () { return "Дія застосована до значень невідповідних типів: перевір, що ти додаєш, множиш чи викликаєш."; },
  ValueError: function () { return "Значення має правильний тип, але не підходить: перевір, що саме ти перетворюєш."; },
  IndentationError: function () { return "Відступи в коді не збігаються: вирівняй рядки кожного блоку однаково."; },
  SyntaxError: function () { return "Синтаксична помилка: перевір двокрапки, дужки, лапки та написання ключових слів."; },
  ZeroDivisionError: function () { return "Ділити на нуль не можна: перевір, чи дільник не дорівнює нулю."; },
  IndexError: function () { return "Індекс виходить за межі: у послідовності немає елемента з таким номером."; },
  KeyError: function (m) {
    var k = /^KeyError:\s*(.+)$/m.exec(m);
    return k ? "У словнику немає ключа " + k[1] + ": перевір, чи він існує." : "У словнику немає такого ключа: перевір його написання.";
  },
  AttributeError: function () { return "У цього об'єкта немає такого атрибута чи методу: перевір назву й тип значення."; }
};

function hint(traceback) {
  var tb = String(traceback == null ? "" : traceback);
  var line = null, re = /File "<exec>", line (\d+)/g, m;
  while ((m = re.exec(tb))) line = parseInt(m[1], 10);
  var lines = tb.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
  var type = "Error", last = "";
  for (var i = lines.length - 1; i >= 0; i--) {
    var t = /^([A-Za-z_][\w.]*(?:Error|Exception|Exit|Interrupt|Warning))(?::|$)/.exec(lines[i]);
    if (t) { type = t[1].split(".").pop(); last = lines[i]; break; }
  }
  var make = TEXTS[type];
  var text = type === "RuntimeError" && /input\(\)/.test(last) ? "Дані вже лежать у змінних із «Вхідних даних» — використай їх замість input()." : make ? make(last) : "Сталася помилка " + type + ": прочитай повідомлення під кодом і перевір рядок, на який воно вказує.";
  return { type: type, line: line, text: text };
}

/* Прибирає внутрішні кадри Pyodide: лишає заголовок, кадри File "<exec>" з їхніми рядками коду та фінальну помилку. */
function clean(traceback) {
  var lines = String(traceback == null ? "" : traceback).replace(/\r\n?/g, "\n").split("\n");
  var out = [], skipping = false;
  lines.forEach(function (l) {
    if (/^\s*File "/.test(l)) { skipping = !/^\s*File "<exec>"/.test(l); if (!skipping) out.push(l); return; }
    if (skipping && /^\s/.test(l)) return;
    skipping = false;
    out.push(l);
  });
  return out.join("\n");
}

window.Py = window.Py || {};
window.Py.errors = { hint: hint, clean: clean };
})();

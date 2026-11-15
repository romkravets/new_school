/* Модуль shield (урок 13): групи пінів Sensor Shield V5 на Arduino UNO, модулі й сумісність роз'ємів.
   Підключення:  <script src="../../assets/boards/shield.js"></script>
   Дані: лаба 1 (rp/LAB_2) — цифрові 0–13, аналогові A0–A5, I2C, серійний інтерфейс, живлення, перемичка SEL;
   UNO: ШІМ на 3, 5, 6, 9, 10, 11; I2C = A4 (SDA) і A5 (SCL); UART = 0 (RX) і 1 (TX). */
(function(){
"use strict";

var KIND_LABELS = {
  digital: "Цифровий пін",
  pwm: "Цифровий пін з ШІМ (~)",
  analog: "Аналоговий пін (A0–A5)",
  i2c: "Роз'єм I2C (SDA/SCL)",
  uart: "Серійний порт (UART, 0/1)",
  power: "Живлення (5V, GND)"
};

var PIN_GROUPS = [
  { id: "digital", label: "Цифрові піни", kind: "digital",
    pins: ["2", "4", "7", "8", "12", "13"],
    note: "Цифрові піни 0–13 мають рядки по три контакти G-V-S: земля, живлення, сигнал. Тут сигнал лише HIGH або LOW: кнопка, геркон, світлодіод. Піни 0 і 1 зарезервовано під UART." },
  { id: "pwm", label: "Піни з ШІМ (~)", kind: "pwm",
    pins: ["3", "5", "6", "9", "10", "11"],
    note: "На UNO ШІМ (analogWrite) працює лише на пінах 3, 5, 6, 9, 10, 11; на платі їх позначено знаком ~. Потрібні для яскравості, кольору RGB і сервопривода." },
  { id: "analog", label: "Аналогові входи A0–A5", kind: "analog",
    pins: ["A0", "A1", "A2", "A3", "A4", "A5"],
    note: "Аналогові входи читають напругу від 0 до 5 В як число 0–1023 (analogRead): потенціометр, датчик звуку. Також їх можна використати як цифрові." },
  { id: "i2c", label: "I2C (SDA, SCL)", kind: "i2c",
    pins: ["SDA", "SCL"],
    note: "Двопровідна шина: SDA (дані) і SCL (такт). На UNO це піни A4 і A5, тому їх не можна одночасно використовувати для інших цілей. Сюди підключають LCD з I2C." },
  { id: "uart", label: "Серійний порт (UART)", kind: "uart",
    pins: ["0", "1"],
    note: "Піни 0 (RX) і 1 (TX) — серійний зв'язок, ним UNO говорить із комп'ютером через USB. Підключений модуль заважає завантажувати програму." },
  { id: "power", label: "Живлення і земля", kind: "power",
    pins: ["5V", "3.3V", "GND", "VIN"],
    note: "5V і 3.3V — живлення модулів, GND — спільна земля, VIN — вхідна напруга плати. Ряди G у роз'ємах шилда з'єднані із землею, а ряди V зазвичай дають 5 В; якщо подано зовнішнє живлення, на V може бути інша напруга (наприклад, 7 В)." },
  { id: "ext-power", label: "Зовнішнє живлення і SEL", kind: "power",
    pins: ["V", "SEL"],
    note: "Клемна колодка для зовнішнього джерела, коли пристрою потрібна напруга не 5 В. Перемичка SEL обирає, чи подається зовнішня напруга також на V1 і +: без перемички на V буде зовнішня напруга, а на V1 і + залишається 5 В від мікроконтролера." }
];

var MODULES = [
  { id: "button", name: "Кнопка", io: "input", connector: "digital" },
  { id: "potentiometer", name: "Потенціометр", io: "input", connector: "analog" },
  { id: "buzzer", name: "Зумер", io: "output", connector: "digital" },
  { id: "rgb", name: "RGB-світлодіод", io: "output", connector: "pwm" },
  { id: "vibration", name: "Датчик вібрації", io: "input", connector: "digital" },
  { id: "reed", name: "Геркон", io: "input", connector: "digital" },
  { id: "hall", name: "Датчик Холла", io: "input", connector: "digital" },
  { id: "line", name: "Датчик лінії", io: "input", connector: "digital" },
  { id: "sound", name: "Датчик звуку", io: "input", connector: "analog" },
  { id: "encoder", name: "Енкодер", io: "input", connector: "digital" },
  { id: "servo", name: "Сервопривід", io: "output", connector: "pwm" },
  { id: "lcd-i2c", name: "LCD з I2C", io: "output", connector: "i2c" }
];

function matchModule(moduleId, kind){
  var m = null;
  for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === moduleId) m = MODULES[i];
  if (!m) return { ok: false, why: "Невідомий модуль." };
  if (!Object.prototype.hasOwnProperty.call(KIND_LABELS, kind)) return { ok: false, why: "Невідомий тип роз'єму." };
  if (m.connector === kind) return { ok: true, why: m.name + ": підходить " + KIND_LABELS[kind].toLowerCase() + "." };
  if (m.connector === "digital" && kind === "pwm") {
    return { ok: true, why: m.name + " цифровий; пін із ШІМ теж може працювати як звичайний цифровий." };
  }
  var need = KIND_LABELS[m.connector].toLowerCase();
  return { ok: false, why: m.name + " потребує роз'єму «" + need + "», а не «" + KIND_LABELS[kind].toLowerCase() + "»." };
}

window.Boards = window.Boards || {};
window.Boards.shield = { PIN_GROUPS: PIN_GROUPS, MODULES: MODULES, KIND_LABELS: KIND_LABELS, matchModule: matchModule };
})();

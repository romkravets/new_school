/* Модуль tester (урок 20 «Тестувальник»): програми з типовою помилкою розгалуження.
   Підключення:  <script src="../../assets/py/tester.js"></script>  → window.Py.tester
   Кожна програма: code (текст для учня), vars (вхідні змінні), buggy/correct(vars) → рядок виводу,
   bugLine (1-based рядок помилки в code), why (пояснення), fixes (3 варіанти, 1 правильний):
   line — текст, яким замінюють рядок bugLine (без початкового відступу; може бути багаторядковим — тоді наступні рядки мають власні відступи).
   Вхід у Python-коді читається через input(): int, bool (рядок «так»/«ні»), str. */
(function(){
"use strict";

var PROGRAMS = [
  {
    id: "leap",
    title: "Високосний рік",
    code: [
      "year = int(input())",
      "if year % 4 == 0 and year % 100 != 0:",
      "    print(\"Високосний\")",
      "else:",
      "    print(\"Звичайний\")"
    ].join("\n"),
    vars: [{ name: "year", kind: "int", hint: "рік, наприклад 2024" }],
    buggy: function (v) { return v.year % 4 === 0 && v.year % 100 !== 0 ? "Високосний" : "Звичайний"; },
    correct: function (v) { return v.year % 4 === 0 && (v.year % 100 !== 0 || v.year % 400 === 0) ? "Високосний" : "Звичайний"; },
    bugLine: 2,
    why: "Умова не враховує роки, кратні 400: 2000 — високосний, але ділиться на 100, тому програма каже «Звичайний».",
    fixes: [
      { line: "if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):", ok: true, why: "Рік кратний 100 усе ж високосний, якщо він кратний 400." },
      { line: "if year % 4 == 0 or year % 100 != 0:", ok: false, why: "З «or» високосними стануть, наприклад, 2023 і 2025: вони не кратні 100." },
      { line: "if year % 4 == 0 and year % 400 != 0:", ok: false, why: "Така умова відкидає звичайні високосні роки: 2024 не кратний 400, а 2000 усе одно лишається «Звичайним»." }
    ]
  },
  {
    id: "max3",
    title: "Максимум із трьох",
    code: [
      "a = int(input())",
      "b = int(input())",
      "c = int(input())",
      "if a > b and a > c:",
      "    m = a",
      "elif b > a and b > c:",
      "    m = b",
      "else:",
      "    m = c",
      "print(m)"
    ].join("\n"),
    vars: [
      { name: "a", kind: "int", hint: "перше число" },
      { name: "b", kind: "int", hint: "друге число" },
      { name: "c", kind: "int", hint: "третє число" }
    ],
    buggy: function (v) {
      var m;
      if (v.a > v.b && v.a > v.c) m = v.a;
      else if (v.b > v.a && v.b > v.c) m = v.b;
      else m = v.c;
      return String(m);
    },
    correct: function (v) { return String(Math.max(v.a, v.b, v.c)); },
    bugLine: 4,
    why: "Строгі нерівності «>» не спрацьовують, коли найбільші числа рівні (5, 5, 1), і програма потрапляє в else та друкує c.",
    fixes: [
      { line: "if a >= b and a >= c:", ok: true, why: "Нестрога нерівність охоплює випадок рівних значень; решту розбере elif." },
      { line: "if a > b or a > c:", ok: false, why: "З «or» умова спрацює навіть коли a менше за c, наприклад 3, 1, 9." },
      { line: "if a > b and b > c:", ok: false, why: "Ця умова перевіряє порядок a, b, c, а не те, що a найбільше: 9, 1, 5 дасть 5 замість 9." }
    ]
  },
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    code: [
      "n = int(input())",
      "if n % 3 == 0:",
      "    print(\"Fizz\")",
      "elif n % 5 == 0:",
      "    print(\"Buzz\")",
      "elif n % 15 == 0:",
      "    print(\"FizzBuzz\")",
      "else:",
      "    print(n)"
    ].join("\n"),
    vars: [{ name: "n", kind: "int", hint: "число, наприклад 15" }],
    buggy: function (v) {
      if (v.n % 3 === 0) return "Fizz";
      if (v.n % 5 === 0) return "Buzz";
      if (v.n % 15 === 0) return "FizzBuzz";
      return String(v.n);
    },
    correct: function (v) {
      if (v.n % 15 === 0) return "FizzBuzz";
      if (v.n % 3 === 0) return "Fizz";
      if (v.n % 5 === 0) return "Buzz";
      return String(v.n);
    },
    bugLine: 2,
    why: "Перевірка на 3 стоїть раніше за перевірку на 15: число 15 ділиться на 3, тож гілка FizzBuzz недосяжна.",
    fixes: [
      { line: "if n % 15 == 0:\n    print(\"FizzBuzz\")\nelif n % 3 == 0:", ok: true, why: "Найвужчу умову (кратне і 3, і 5) треба ставити першою, а загальніші — після неї; стара гілка внизу стає зайвою." },
      { line: "if n % 3 == 0 and n % 5 != 0:", ok: false, why: "Тепер 15 пропускає першу гілку, але далі потрапляє в «Buzz», а не в «FizzBuzz»." },
      { line: "if n % 3 == 0 or n % 5 == 0:", ok: false, why: "Ця умова спрацює і для 5, і для 15, тож надрукує «Fizz» для всіх кратних 3 або 5." }
    ]
  },
  {
    id: "discount",
    title: "Знижка в магазині",
    code: [
      "age = int(input())",
      "student = input() == \"так\"",
      "price = 200",
      "if age >= 65 and student:",
      "    price = price // 2",
      "print(price)"
    ].join("\n"),
    vars: [
      { name: "age", kind: "int", hint: "вік покупця" },
      { name: "student", kind: "bool", hint: "чи покупець студент" }
    ],
    buggy: function (v) { return String(v.age >= 65 && v.student ? 100 : 200); },
    correct: function (v) { return String(v.age >= 65 || v.student ? 100 : 200); },
    bugLine: 4,
    why: "Знижка належить пенсіонерам АБО студентам, а «and» вимагає обох умов одразу, тож пенсіонер без студентського отримує повну ціну.",
    fixes: [
      { line: "if age >= 65 or student:", ok: true, why: "Достатньо виконання хоча б однієї з двох умов." },
      { line: "if age >= 65 and not student:", ok: false, why: "Тепер знижку отримають лише пенсіонери-нестуденти, а студенти — ні." },
      { line: "if age > 65 or student:", ok: false, why: "«or» тут правильний, але «>» відсікає рівно 65-річних, хоча вони мають знижку." }
    ]
  }
];

function find(id) {
  for (var i = 0; i < PROGRAMS.length; i++) if (PROGRAMS[i].id === id) return PROGRAMS[i];
  return null;
}

function breaks(id, vars) {
  var p = find(id);
  return p ? p.buggy(vars) !== p.correct(vars) : false;
}

window.Py = window.Py || {};
window.Py.tester = { PROGRAMS: PROGRAMS, find: find, breaks: breaks };
})();

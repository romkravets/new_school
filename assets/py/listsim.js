/* Модуль listsim (уроки 23–24): модель методів списку Python. Список не мутується — повертається копія.
   Підключення:  <script src="../../assets/py/listsim.js"></script>  → window.Py.listsim
   apply(list, {method, args, kwargs}) → {list, returned, error}.
   sort з reverse=True: або args[0] = {reverse:true}, або op.kwargs = {reverse:true}.
   Методи, що в Python повертають None, дають returned = null. Помилки — імена винятків Python. */
(function(){
"use strict";

function isInt(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; }
function fail(l, err) { return { list: l, returned: null, error: err }; }

function apply(list, op) {
  var l = list.slice(), args = (op && op.args) || [], n = l.length, i, ret = null;
  switch (op && op.method) {
    case "append":
      if (args.length !== 1) return fail(l, "TypeError");
      l.push(args[0]); break;
    case "insert":
      if (args.length !== 2 || !isInt(args[0])) return fail(l, "TypeError");
      i = args[0];
      if (i < 0) i = Math.max(0, i + n);
      if (i > n) i = n;
      l.splice(i, 0, args[1]); break;
    case "remove":
      if (args.length !== 1) return fail(l, "TypeError");
      i = l.indexOf(args[0]);
      if (i < 0) return fail(l, "ValueError");
      l.splice(i, 1); break;
    case "pop":
      if (args.length > 1 || (args.length && !isInt(args[0]))) return fail(l, "TypeError");
      i = args.length ? args[0] : -1;
      if (i < 0) i += n;
      if (n === 0 || i < 0 || i >= n) return fail(l, "IndexError");
      ret = l.splice(i, 1)[0]; break;
    case "sort": {
      var kw = (op.kwargs) || (args[0] && typeof args[0] === "object" ? args[0] : {});
      var kinds = {};
      l.forEach(function (x) { kinds[typeof x] = true; });
      if (Object.keys(kinds).length > 1) return fail(l, "TypeError");
      var dir = kw.reverse ? -1 : 1; // рівні елементи нерозрізнювані, тож стабільність не видна
      l.sort(function (a, b) { return a < b ? -dir : a > b ? dir : 0; });
      break;
    }
    case "reverse": l.reverse(); break;
    case "index":
      if (args.length !== 1) return fail(l, "TypeError");
      i = l.indexOf(args[0]);
      if (i < 0) return fail(l, "ValueError");
      ret = i; break;
    case "count":
      if (args.length !== 1) return fail(l, "TypeError");
      ret = l.filter(function (x) { return x === args[0]; }).length; break;
    case "extend":
      if (args.length !== 1 || (!Array.isArray(args[0]) && typeof args[0] !== "string")) return fail(l, "TypeError");
      l = l.concat(typeof args[0] === "string" ? args[0].split("") : args[0]); break;
    case "clear": l = []; break;
    default: return fail(l, "AttributeError");
  }
  return { list: l, returned: ret, error: null };
}

// Модель «a = a.method(...)»: у змінну потрапляє те, що ПОВЕРНУВ метод.
// mutated — що сталося б зі старим списком (на нього вже ніхто не посилається).
function assign(list, op) {
  var r = apply(list, op);
  if (r.error) return { list: list.slice(), returned: null, error: r.error, mutated: r.list };
  return { list: r.returned, returned: r.returned, error: null, mutated: r.list };
}

window.Py = window.Py || {};
window.Py.listsim = { apply: apply, assign: assign };
})();

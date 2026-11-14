/* Спільна логіка для всіх уроків-інтерактивів.
   Підключення в уроці:  <script src="../../assets/lesson.js"></script>

   Що вміє:
   - вкладки (nav.tabs + section.panel) працюють самі;
   - бали рахуються самі й показуються в [data-score], [data-max], [data-final-msg];
   - готові вправи:
       Lesson.quiz(el, questions)   — вікторина по одному питанню
       Lesson.match(el, config)     — відповідність через випадні списки
       Lesson.sort(el, config)      — віднести кожен приклад до категорії
   Формат даних для кожної вправи описано біля функції нижче. */
(function(){
"use strict";

var reg = {};   // id вправи -> {score, max}
var uid = 0;

function esc(s){
  return String(s).replace(/[&<>"]/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];
  });
}
function $(sel, root){ return (root || document).querySelector(sel); }
function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function el(tag, cls, html){
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

/* ---------- Бали ---------- */
var messages = {
  high: "Чудово! Ти впевнено володієш темою.",
  mid:  "Добрий результат. Переглянь пояснення там, де були помилки.",
  low:  "Хороший початок. Повернись до теорії і спробуй ще раз: з кожною спробою виходить краще."
};
function register(max){
  var id = "ex" + (++uid);
  reg[id] = {score:0, max:Math.max(0, Number(max) || 0)};
  renderScore();
  return id;
}
function setScore(id, v){
  if (!reg[id]) return;
  reg[id].score = Math.max(0, Math.min(reg[id].max, Number(v) || 0));
  renderScore();
}
function addScore(id){ if (reg[id]) setScore(id, reg[id].score + 1); }
function renderScore(){
  var s = 0, m = 0;
  Object.keys(reg).forEach(function(k){ s += reg[k].score; m += reg[k].max; });
  $$("[data-score]").forEach(function(e){ e.textContent = s; });
  $$("[data-max]").forEach(function(e){ e.textContent = m; });
  var p = m ? s / m : 0;
  $$("[data-final-msg]").forEach(function(e){
    e.textContent = p >= 0.85 ? messages.high : p >= 0.6 ? messages.mid : messages.low;
  });
}

/* ---------- Вкладки ---------- */
function initTabs(){
  var tabs = $$("nav.tabs button");
  tabs.forEach(function(b){
    b.setAttribute("role", "tab");
    b.addEventListener("click", function(){ goTo(b.dataset.tab, false, true); });
    if (b.dataset.break && !$(".break-time", b)){
      var badge = el("span", "break-time", "⏱ " + esc(b.dataset.break) + " хв");
      b.appendChild(badge);
    }
  });
  $$("section.panel").forEach(function(p){ p.setAttribute("role", "tabpanel"); });
  if (new URLSearchParams(window.location.search).has("projector")) document.body.classList.add("projector");
  var first = tabs[0];
  if (first){
    var requested = window.location.hash.slice(1);
    var target = tabs.find(function(b){ return b.dataset.tab === requested; });
    goTo(target ? target.dataset.tab : first.dataset.tab, true);
  }
  window.addEventListener("hashchange", function(){
    var requested = window.location.hash.slice(1);
    if (tabs.some(function(b){ return b.dataset.tab === requested; })) goTo(requested, true);
  });
}
function goTo(id, noScroll, updateAddress){
  if (!id || !document.getElementById(id) || !document.getElementById(id).classList.contains("panel")) return;
  $$("nav.tabs button").forEach(function(x){ x.setAttribute("aria-selected", x.dataset.tab === id ? "true" : "false"); });
  $$("section.panel").forEach(function(p){ p.classList.toggle("active", p.id === id); });
  if (updateAddress && window.location.hash !== "#" + encodeURIComponent(id)){
    window.history.replaceState(null, "", "#" + encodeURIComponent(id));
  }
  if (!noScroll) window.scrollTo({top:0, behavior:"smooth"});
}
function nextTab(){
  var tabs = $$("nav.tabs button");
  var i = tabs.findIndex(function(b){ return b.getAttribute("aria-selected") === "true"; });
  if (i >= 0 && i < tabs.length - 1) goTo(tabs[i + 1].dataset.tab);
}

/* ---------- Вікторина ----------
   questions = [{
     ctx:    "Ситуація…"            (необов'язково)
     prompt: "Текст у рамці"        (необов'язково: код, промпт, цитата)
     q:      "Питання?",
     o:      ["варіант 0", "варіант 1", …],
     a:      1,                     (номер правильного варіанта, з 0)
     e:      "Пояснення"            (показується після відповіді)
   }, …] */
function quiz(root, Q){
  if (typeof root === "string") root = $(root);
  var id = register(Q.length);
  root.innerHTML =
    '<div class="progress"></div><p class="ctx" style="margin:8px 0 0"></p>' +
    '<div class="code" hidden></div><div><b class="q"></b></div><div class="opts"></div>' +
    '<div class="fb" aria-live="polite"></div>' +
    '<div class="row" style="margin-top:12px"><button class="btn next" type="button" disabled>Далі</button>' +
    '<button class="btn ghost restart" type="button">Почати знову</button></div>';
  var qi = 0, answered = {};
  function render(){
    var q = Q[qi];
    $(".progress", root).textContent = "Питання " + (qi + 1) + " з " + Q.length;
    var ctx = $(".ctx", root); ctx.textContent = q.ctx ? "Ситуація: " + q.ctx : ""; ctx.hidden = !q.ctx;
    var code = $(".code", root); code.textContent = q.prompt || ""; code.hidden = !q.prompt;
    $(".q", root).textContent = q.q;
    var box = $(".opts", root); box.innerHTML = "";
    var fb = $(".fb", root); fb.className = "fb"; fb.innerHTML = "";
    var next = $(".next", root);
    next.disabled = true;
    next.textContent = qi === Q.length - 1 ? "Далі →" : "Наступне питання";
    q.o.forEach(function(t, i){
      var b = el("button", "opt"); b.type = "button"; b.textContent = t;
      b.addEventListener("click", function(){
        if (answered[qi] !== undefined) return;
        answered[qi] = i;
        var ok = i === q.a;
        if (ok) addScore(id);
        $$(".opt", box).forEach(function(x, j){
          x.disabled = true;
          if (j === q.a) x.classList.add("right");
          else if (j === i) x.classList.add("wrong");
        });
        fb.className = "fb show " + (ok ? "ok" : "no");
        fb.innerHTML = "<b>" + (ok ? "Так! " : "Не зовсім. ") + "</b>" + esc(q.e || "");
        next.disabled = false;
      });
      box.appendChild(b);
    });
  }
  $(".next", root).addEventListener("click", function(){
    if (qi < Q.length - 1){ qi++; render(); } else nextTab();
  });
  $(".restart", root).addEventListener("click", function(){
    qi = 0; answered = {}; setScore(id, 0); render();
  });
  render();
}

/* ---------- Відповідність ----------
   config = {
     options: ["Варіант А", "Варіант Б", …],     (що обирають у списку)
     items: [{ s: "Ситуація", a: 0, e: "Пояснення" }, …]   (a — номер у options)
   } */
function match(root, cfg){
  if (typeof root === "string") root = $(root);
  var id = register(cfg.items.length);
  function render(){
    root.innerHTML = '<div class="match"></div><div class="row" style="margin-top:12px">' +
      '<button class="btn check" type="button">Перевірити</button>' +
      '<button class="btn ghost reset" type="button">Спробувати ще раз</button></div>' +
      '<div class="fb" aria-live="polite"></div>';
    var list = $(".match", root);
    var opts = '<option value="">— обери —</option>' + cfg.options.map(function(t, j){
      return '<option value="' + j + '">' + esc(t) + "</option>";
    }).join("");
    cfg.items.forEach(function(m, i){
      var sid = id + "-s" + i;
      var d = el("div", "item",
        '<label class="f" for="' + sid + '">' + (i + 1) + ". " + esc(m.s) + "</label>" +
        '<select id="' + sid + '">' + opts + '</select><div class="why"></div>');
      list.appendChild(d);
    });
    $(".check", root).addEventListener("click", check);
    $(".reset", root).addEventListener("click", function(){ setScore(id, 0); render(); });
  }
  function check(){
    var sels = $$("select", root), fb = $(".fb", root);
    if (sels.some(function(s){ return s.value === ""; })){
      fb.className = "fb show no"; fb.textContent = "Заповни всі пункти, а потім перевір."; return;
    }
    var c = 0;
    cfg.items.forEach(function(m, i){
      var ok = +sels[i].value === m.a;
      if (ok) c++;
      var it = sels[i].parentNode;
      it.classList.add(ok ? "ok" : "no");
      $(".why", it).innerHTML = (ok ? "<b>Правильно.</b> " : "<b>Правильна відповідь: " + esc(cfg.options[m.a]) + ".</b> ") + esc(m.e || "");
      sels[i].disabled = true;
    });
    setScore(id, c);
    fb.className = "fb show " + (c === cfg.items.length ? "ok" : "no");
    fb.textContent = c === cfg.items.length ? "Усі " + c + " правильно!" : "Правильно " + c + " з " + cfg.items.length + ". Переглянь пояснення і спробуй ще раз.";
    $(".check", root).disabled = true;
  }
  render();
}

/* ---------- Сортування за категоріями ----------
   config = {
     choices: ["Допустимо", "За умов", "Недопустимо"],
     items: [{ s: "Ситуація", a: 2, e: "Пояснення" }, …]   (a — номер у choices)
   } */
function sort(root, cfg){
  if (typeof root === "string") root = $(root);
  var id = register(cfg.items.length);
  function render(){
    root.innerHTML = '<div class="sort"></div><div class="row" style="margin-top:12px">' +
      '<button class="btn ghost reset" type="button">Спробувати ще раз</button></div>';
    var list = $(".sort", root);
    cfg.items.forEach(function(it, i){
      var d = el("div", "item card", "<div><b>" + (i + 1) + ".</b> " + esc(it.s) + '</div><div class="choices"></div><div class="why"></div>');
      var ch = $(".choices", d), done = false;
      cfg.choices.forEach(function(c, j){
        var b = el("button"); b.type = "button"; b.textContent = c;
        b.addEventListener("click", function(){
          if (done) return; done = true;
          var ok = j === it.a;
          if (ok) addScore(id);
          $$("button", ch).forEach(function(x, k){
            x.disabled = true;
            if (k === it.a) x.classList.add("right");
            else if (k === j) x.classList.add("wrong");
          });
          d.classList.add("done");
          $(".why", d).innerHTML = "<b>" + (ok ? "Так. " : "Правильна відповідь: " + esc(cfg.choices[it.a].toLowerCase()) + ". ") + "</b>" + esc(it.e || "");
        });
        ch.appendChild(b);
      });
      list.appendChild(d);
    });
    $(".reset", root).addEventListener("click", function(){ setScore(id, 0); render(); });
  }
  render();
}

window.Lesson = {
  quiz: quiz, match: match, sort: sort,
  goTo: goTo, nextTab: nextTab, esc: esc,
  register: register, addScore: addScore, setScore: setScore,
  messages: messages   // можна змінити тексти підсумку: Lesson.messages.high = "…"
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function(){ initTabs(); renderScore(); });
else { initTabs(); renderScore(); }
})();

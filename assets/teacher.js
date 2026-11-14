(function(){
  "use strict";

  function esc(value){
    return String(value == null ? "" : value).replace(/[&<>"]/g, function(char){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char];
    });
  }
  function timelineMarkup(duration, items, lessonUrl){
    var total = items.reduce(function(sum, item){ return sum + Number(item.min || 0); }, 0);
    var rows = items.map(function(item){
      var link = "";
      if (item.link){
        var href = item.link;
        if (item.projector){
          var parts = href.split("#");
          href = parts[0] + (parts[0].indexOf("?") === -1 ? "?projector" : "&projector") + (parts[1] ? "#" + parts[1] : "");
        }
        link = '<a href="' + esc(href) + '">Перейти до матеріалу →</a>';
      }
      return '<li class="timeline-item ' + esc(item.kind || "") + '">' +
        '<div class="timeline-min">' + esc(item.min) + ' хв</div><div><h3>' + esc(item.title) + '</h3>' +
        (item.text ? '<p>' + esc(item.text) + '</p>' : '') + link + '</div></li>';
    }).join("");
    return '<ol class="timeline">' + rows + '</ol>' +
      (total === duration ? "" : '<p class="timeline-warning" role="alert">Тривалість етапів — ' + total +
        ' хв, у плані вказано ' + duration + ' хв. Перевірте таймлайн.</p>');
  }

  function timeline(duration, items, root){
    root = typeof root === "string" ? document.querySelector(root) : root || document.querySelector("[data-timeline]");
    if (!root) throw new Error("Не знайдено контейнер для таймлайну.");
    root.innerHTML = timelineMarkup(duration, items, "");
  }

  function renderList(items){
    return '<ul class="tight">' + items.map(function(item){ return '<li>' + esc(item) + '</li>'; }).join("") + '</ul>';
  }

  function renderResources(resources){
    if (!resources.length) return '<p class="teacher-note">Матеріали до цього уроку ще не додано.</p>';
    return '<div class="resource-list">' + resources.map(function(resource){
      var link = resource.url
        ? '<a href="' + esc(resource.url) + '" target="_blank" rel="noopener">' + esc(resource.title) + '</a>'
        : '<b>' + esc(resource.title) + '</b>';
      return '<div class="resource">' + link +
        (resource.detail ? '<p>' + esc(resource.detail) + '</p>' : '') +
        (resource.verified ? '<p class="verify">Посилання перевірено: ' + esc(resource.verified) + '</p>' :
          '<p class="verify">Посилання або добірку потрібно перевірити перед уроком.</p>') + '</div>';
    }).join("") + '</div>';
  }

  function render(){
    var root = document.getElementById("teacher-app");
    var plan = window.TEACHER_PLAN;
    if (!root || !plan) return;

    var program = (window.PROGRAMS || []).find(function(item){ return item.id === plan.program; });
    var topic = ((window.TOPICS || {})[plan.program] || []).find(function(item){ return item.num === plan.num; });
    if (!program || !topic){
      root.innerHTML = '<div class="teacher-error">Не вдалося знайти курс або тему для плану вчителя. Перевірте дані програми.</div>';
      return;
    }

    var lessonUrl = "index.html";
    var timelineItems = plan.timeline.map(function(item){
      return Object.assign({}, item, { link: item.link ? lessonUrl + item.link : "" });
    });
    var groups = (program.groups || []).map(function(group){
      return group.name + ": " + group.hours.s1 + "/" + group.hours.s2 + " год/тиж.";
    });
    var homework = plan.homework || topic.homework || "Домашнє завдання в календарному плані не вказане.";
    root.innerHTML =
      '<a class="back" href="../../index.html#' + esc(plan.program) + '">← До курсу</a>' +
      '<header class="hero">' +
        '<small>' + esc(program.title) + ' · ' + topic.num + ' урок · ' + esc(topic.semester) + ' семестр</small>' +
        '<h1>' + esc(topic.title) + '</h1>' +
        '<p>' + esc(program.authors || program.level || "") + (groups.length ? ' · ' + esc(groups.join("; ")) : "") + '</p>' +
        '<div class="teacher-actions">' +
          '<a class="btn" href="' + lessonUrl + '">Відкрити інтерактив</a>' +
          '<a class="btn ghost" href="' + lessonUrl + '?projector">Режим проєктора</a>' +
          '<button class="btn ghost no-print" type="button" data-print>Друкувати план</button>' +
        '</div>' +
      '</header>' +
      '<section class="teacher-section card"><h2>Мета й ключові ідеї</h2>' + renderList(plan.goals || []) + '</section>' +
      '<section class="teacher-section card"><h2>Хід уроку · ' + esc(plan.duration || 45) + ' хв</h2>' +
        '<div data-timeline></div></section>' +
      '<div class="teacher-grid">' +
        '<section class="teacher-section card"><h2>Цікавинка на старт</h2><p>' + esc(plan.hook || "") + '</p></section>' +
        '<section class="teacher-section card"><h2>Ресурси</h2>' + renderResources(plan.resources || []) + '</section>' +
      '</div>' +
      '<section class="teacher-section card"><h2>Питання для обговорення</h2>' + renderList(plan.discussion || []) + '</section>' +
      '<section class="teacher-section card"><h2>Домашнє завдання з Мрії</h2>' +
        '<label class="f" for="teacher-homework">За потреби відредагуйте перед уроком:</label>' +
        '<textarea class="teacher-homework" id="teacher-homework">' + esc(homework) + '</textarea>' +
        (plan.mistakes && plan.mistakes.length ? '<h3 style="margin-top:14px">Типові помилки</h3>' + renderList(plan.mistakes) : '') +
      '</section>' +
      '<footer>Учительський план · матеріали можна адаптувати до класу</footer>';

    timeline(plan.duration || 45, timelineItems, root.querySelector("[data-timeline]"));
    root.querySelector("[data-print]").addEventListener("click", function(){ window.print(); });
  }

  window.Teacher = { timeline: timeline };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();

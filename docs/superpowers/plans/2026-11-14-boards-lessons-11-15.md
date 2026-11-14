# «Розумні плати», уроки 11–15 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** П'ять уроків курсу «Розумні плати» (11–15) з відступами-симуляторами, однією three.js-сценою (куб RGB) і учительськими картками, плюс тестова інфраструктура для логіки інтерактивів.

**Architecture:** Логіка кожного симулятора — класичний IIFE-скрипт `assets/boards/<name>.js`, що додає `window.Boards.<name>`; сторінки уроків лише підключають його і малюють UI. Тести (vitest + jsdom) виконують ці скрипти у `window` і перевіряють чисті функції; інтеграційний тест відкриває кожну сторінку уроку в jsdom. Учительські плани — записи `"boards:N"` у `data/teacher-plans.js`, як у курсу ШІ.

**Tech Stack:** HTML/CSS/JS без збірки (GitHub Pages), three@0.165.0 через importmap + `assets/scene.js`, Node 24, vitest + jsdom (dev only).

**Spec:** `docs/superpowers/specs/2026-11-14-boards-lessons-11-15-design.md` (разом з базовим `2026-11-14-lesson-resource-design.md`).

## Global Constraints

- Статичний сайт: жодних кроків збірки для роботи сторінок; `npm test` — лише для розробника. `node_modules/` і `.DS_Store` у `.gitignore`.
- Українська в UI, коментарях і текстах; англійська в ідентифікаторах.
- Модулі логіки — класичні скрипти (IIFE), простір імен `window.Boards.<name>`; сторінки підключають їх через `<script src="../../assets/boards/<name>.js">` після `lesson.js`.
- Піни й номінали строго з PDF: світлофор — червоний 7, жовтий 6, зелений 5; RGB — червоний 6, синій 5, зелений 3, спільний катод; резистори 220 Ом; вбудований світлодіод — пін 13; ШІМ-піни UNO: 3, 5, 6, 9, 10, 11. PDF важливіший за план: розбіжність → слідувати PDF і записати у звіт.
- Поріг «око не бачить миготіння»: період ≥ 40 мс = видно; < 40 мс = не видно.
- Відступи не довші 7 хв; кожен симулятор керується з клавіатури.
- Бали лише там, де є правильна відповідь: через `Lesson.register(max)` / `Lesson.addScore(id)` / `Lesson.setScore(id, v)`.
- Шапка уроку: `Заняття N · Розумні плати · 10 клас`, `--accent: var(--orange)`, «← До курсу» → `../../index.html#boards`; футер з посиланням на `teacher.html` і на PDF лаби, якщо вона є.
- Учительський план: 45 хв, сума `min` = 45; `resources` з полем `verified: "2026-11-14"` лише для посилань, які будівельник справді відкрив; інакше без `verified`.
- Коміти: невеликі, повідомлення українською, закінчуються рядком `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. Користувач вводить у симулятор миготіння `0`, від'ємне або нечислове значення затримки → симулятор не зависає й показує підказку (Task 2: тест `simulate` з `onMs: 0`, `offMs: -5`; UI блокує «Запустити» з повідомленням).
2. У конструкторі циклу обрано `>=0` з `i++` → нескінченний цикл → `{infinite: true}`, UI показує «цикл не завершиться» замість зависання (Task 4).
3. Сторінка відкрита з `file://` або без інтернету → урок 15 працює повністю, сцена замінена картинкою з описом (Task 8: ручна перевірка + fallback-елементи присутні в HTML).
4. Повзунки RGB зі значенням поза 0..255 (клавіатурою/програмно) → `toSketch` і `matches` обрізають до діапазону (Task 7: тест).
5. Посилання на PDF у `course-labs.js` після перейменування папок → тест, що всі `path` існують на диску (Task 1).

---

### Task 1: Тестова інфраструктура і нові шляхи до документів

**Files:**
- Create: `package.json`, `vitest.config.js`, `.gitignore`, `tests/helpers/load-script.js`, `tests/paths.test.js`
- Modify: `programs.js` (`sources`, `grade` для `python`), `data/course-labs.js` (усі `path`, матеріал для теми 13)
- Rename: `documents/rp/ LAB_2` → `documents/rp/LAB_2` (прибрати пробіл на початку; `git mv`)

**Interfaces:**
- Produces: `tests/helpers/load-script.js` з `export function loadScript(window, relPath)` — читає файл відносно кореня репо і виконує його у `window` через `vm`/`window.eval` так, щоб `window.Boards`, `window.Lesson` тощо з'явились; `export function loadPage(folder)` — створює jsdom з `lessons/<folder>/index.html` (`runScripts: "dangerously"`, `resources: "usable"` вимкнено), підміняє відносні `<script src>` на вміст файлів із репо, повертає `window` після `DOMContentLoaded`.

- [ ] **Step 1:** Закомітити перейменування папок `documents/` учителя разом із виправленими `sources` у `programs.js` (`ai/…`, `rp/…`, `steam/…`, `10_p1/…`, `10_p2/…`, `8/…`, `9_1/…`, `11/…`); у `python` поставити `grade: 11`, `level: "11 клас · група 41"`. Виконати `node scripts/import-mriya.mjs` і переконатися, що `git diff --stat data/` порожній (крім можливих відмінностей форматування — тоді зупинитись і повідомити).
- [ ] **Step 2:** `git mv "documents/rp/ LAB_2" documents/rp/LAB_2`; у `data/course-labs.js` замінити всі `documents/роз плати/LAB_1/` → `documents/rp/LAB_1/`, `documents/роз плати/ LAB_2/` → `documents/rp/LAB_2/`; додати до `boards[13]` поле `materials: [{ title: "Sensor Shield V5: будова і підключення модулів (лаба LAB_2 № 1, для ознайомлення)", path: "documents/rp/LAB_2/лаб 1.pdf" }]` зі збереженим `label`/`note`.
- [ ] **Step 3: Написати тест `tests/paths.test.js`:** завантажує `data/course-labs.js` і `programs.js` через `loadScript`, для кожного `materials[].path` і кожного `sources[]` перевіряє `fs.existsSync`; окремо: `window.PROGRAMS.find(p => p.id === "python").grade === 11`.
- [ ] **Step 4:** `package.json`: `{"private": true, "type": "commonjs", "scripts": {"test": "vitest run", "import": "node scripts/import-mriya.mjs"}, "devDependencies": {"vitest": "^3", "jsdom": "^26"}}` (точні версії — останні стабільні, старші за 2 тижні); `vitest.config.js` з `environment: "node"` (jsdom створюється явно в хелпері); `.gitignore`: `node_modules/`, `.DS_Store`. `npm install`.
- [ ] **Step 5: Run** `npm test` → PASS (`paths.test.js`).
- [ ] **Step 6:** Commit: `chore: тести (vitest+jsdom), латинські папки documents, шляхи до PDF лаб`.

### Task 2: Модуль `blink` (урок 11)

**Files:**
- Create: `assets/boards/blink.js`, `tests/boards/blink.test.js`

**Interfaces:**
- Produces `window.Boards.blink`:
  - `simulate({onMs, offMs, durationMs})` → `{events: [{t, state}], error?: string}`; `events` починається з `{t:0, state:1}`; при `onMs <= 0 || offMs <= 0 || !isFinite` → `{events: [], error: "Затримка має бути додатним числом у мілісекундах."}`; `durationMs` за замовчуванням 5000; кількість подій обмежена 2000.
  - `isFlickerVisible(periodMs)` → `periodMs >= 40`.
  - `lintSketch(sketch: string)` → `[{code, line}]`, коди: `no-pinmode`, `wrong-pinmode`, `same-state-twice`, `missing-semicolon`, `serial-before-begin`; `line` з 1; для коректного скетчу → `[]`.
  - `SKETCHES` — масив із 6 об'єктів `{title, code: string, expected: [{code, line}]}`: 1 коректний (лаба 1, завдання 1) + 5 з однією помилкою кожен.
  - `MESSAGES` — словник `code → пояснення українською`.

- [ ] **Step 1: Write the failing tests** (`blink.test.js`, через `loadScript`):
  - `simulate({onMs:1000, offMs:1000, durationMs:3000}).events` → `[{t:0,state:1},{t:1000,state:0},{t:2000,state:1},{t:3000,state:0}]`.
  - `simulate({onMs:0, offMs:1000}).error` визначено, `events` порожній; те саме для `offMs:-5` і `onMs:"abc"`.
  - `simulate({onMs:1, offMs:1, durationMs:60000}).events.length <= 2000`.
  - `isFlickerVisible(39) === false`, `(40) === true`, `(41) === true`.
  - Для кожного елемента `SKETCHES`: `lintSketch(s.code)` дорівнює `s.expected` (`toEqual`), і коректний скетч дає `[]`.
  - `Object.keys(MESSAGES)` містить усі 5 кодів.
- [ ] **Step 2: Run** `npm test -- blink` → FAIL (модуль не знайдено).
- [ ] **Step 3: Implement** `assets/boards/blink.js`. `lintSketch` працює порядково: знаходить рядки `void setup() {`, `pinMode(`, `digitalWrite(13, HIGH|LOW)`, `Serial.begin`, `Serial.println`; `missing-semicolon` — рядок, що містить виклик функції `(...)` і не закінчується на `;`, `{` чи `}`. Скетчі — з лаби 1 (пін 13, 1000 мс, `Serial.begin(9600)`, лічильник `loop()`).
- [ ] **Step 4: Run** `npm test -- blink` → PASS.
- [ ] **Step 5:** Commit: `feat(boards): модуль blink — симулятор миготіння і лінтер скетчу`.

### Task 3: Урок 11 — сторінка учня і учительська картка

**Files:**
- Create: `lessons/11-boards-blink/index.html`, `lessons/11-boards-blink/teacher.html`
- Modify: `lessons.js` (запис `{folder:"11-boards-blink", program:"boards", num:11, status:"ready", teacher:true, tags:["Arduino","світлодіод","delay"]}`), `data/teacher-plans.js` (`"boards:11"`)
- Test: `tests/lessons/boards-pages.test.js` (створити; інші уроки додаватимуть кейси)

**Interfaces:**
- Consumes: `Boards.blink` (Task 2), `Lesson.*`, `loadPage` (Task 1).
- Produces: шаблон структури уроку курсу (копіюють Task 5, 6, 8): вкладки `theory`, `sim` (`data-break="5"`), `flicker` (`data-break="3"`), `lint`, `quiz-tab`, `final`.

- [ ] **Step 1: Write the failing test** у `boards-pages.test.js`: `loadPage("11-boards-blink")` → `window.Lesson` визначено; кожна кнопка `nav.tabs button[data-tab]` має `section.panel#<id>`; `Number(document.querySelector("[data-max]").textContent) >= 4 + 5 + 1` (вікторина 4 + лінтер 5 + миготіння 1); `document.querySelector("#sim")` містить елемент `.led`; футер має посилання на `teacher.html` і на `documents/rp/LAB_1/лаб 1.pdf` (через `../../`).
- [ ] **Step 2: Run** `npm test -- boards-pages` → FAIL.
- [ ] **Step 3: Implement сторінку.** Вкладки за спекою уроку 11: теорія (UNO, пін 13, `setup`/`loop`, три команди, код лаби в `.code`); симулятор (поля `on`/`off`, кнопка «Запустити»/«Зупинити», `.led` з CSS-класом `on`, код із підставленими значеннями, «Монітор порту» — `<pre>` з рядками `LED: ON`/`OFF` і `loop: N`; при `error` — повідомлення у `.fb.no`, кнопка не стартує); «Коли око перестає бачити?» (`<input type=range min=2 max=1000>`, підпис періоду, кнопка «Я не бачу миготіння» → бал, якщо `!isFlickerVisible`; друга спроба дозволена після «Спробувати ще раз», бал не подвоюється); «Знайди помилку» (для кожного зі `SKETCHES` без `expected: []`: рядки коду як кнопки з номерами; клік по рядку → порівняння з `expected[0].line`, бал, `MESSAGES[code]`); вікторина 4 питання (навіщо `pinMode`; що робить `delay(1000)`; одиниці `delay`; навіщо `Serial.begin`). Анімацію світлодіода робити через `setTimeout` за розкладом `events`, зупиняти при зміні вкладки/`pagehide`.
- [ ] **Step 4: Учительська картка.** `teacher.html` як у `lessons/14-ai-video/teacher.html`, але `data/boards.js` і `window.TEACHER_PLANS["boards:11"]`. План: goals (3), timeline 45 хв (`hook` 3, `theory` 8, `break` симулятор 5 з `link:"#sim", projector:true`, `break` миготіння 3, `practice` лаба на платі 18 з текстом «Завдання 1–2 лаби 1», `discuss` 4, `wrap` 4), hook (чому не видно миготіння при 10 мс — зв'язок із частотою кадрів), resources (PDF лаби з `verified`, довідка Arduino `digitalWrite`, `delay`, `Serial.begin` — перевірити через вебпошук/WebFetch і проставити `verified` лише за успіху), discussion (3), mistakes (3).
- [ ] **Step 5: Run** `npm test` → PASS. Відкрити сторінку через `python3 -m http.server` або `npx serve`, пройти всі вкладки й режим `?projector` (ручна перевірка; описати у звіті).
- [ ] **Step 6:** Commit: `feat(boards): урок 11 — миготіння світлодіода, симулятор і лінтер`.

### Task 4: Модуль `leds` (урок 12)

**Files:**
- Create: `assets/boards/leds.js`, `tests/boards/leds.test.js`

**Interfaces:**
- Produces `window.Boards.leds`:
  - `checkWiring({anode, cathode, resistor})` → `{ok: boolean, problems: string[]}`; `anode`/`cathode` ∈ `"pin5" | "gnd" | "5v" | "none"`, `resistor` ∈ `"anode" | "cathode" | "none"`. Правильно: `anode:"pin5"`, `cathode:"gnd"`, `resistor` ≠ `"none"`. Коди проблем: `anode-not-pin`, `cathode-not-gnd`, `no-resistor`, `direct-5v` (анод на 5V без резистора/без піна), `reversed` (анод gnd + катод pin5).
  - `runLoops(loops)` — `loops: [{start: number, cond: string, step: string, body: string}]` (1–2 цикли); `cond ∈ {"<3","<=2","<=3",">=0",">0"}`, `step ∈ {"i++","i--","i+=2"}`, `body ∈ {"on(i)","blink(i)"}`; → `{events: [{i, missing?: true}], iterations, infinite: boolean, problems: string[]}`; ліміт 50 ітерацій на цикл → `infinite:true`, `events` обрізані; `i` поза 0..2 → `missing:true` + `problems` містить `"index-out-of-range"` один раз.
  - `TASKS` — `[{id:"all", title:"Увімкнути всі три по черзі", accept: [[0,1,2]]}, {id:"bounce", title:"Туди-назад", accept: [[0,1,2,1,0],[0,1,2,2,1,0]]}]`; `checkTask(taskId, events)` → `boolean` (порівняння послідовності `i` без `missing`).
  - `trafficLightSteps()` → `[{id, text, seconds}]` у порядку лаби 2: зелений 3 с; зелений блимає 3× ; жовтий 3 с; червоний 3 с; червоний+жовтий 1 с.
  - `PINS = {red:7, yellow:6, green:5}`.

- [ ] **Step 1: Write the failing tests:** `checkWiring` правильна → `ok:true, problems:[]`; `resistor:"cathode"` → `ok:true`; `anode:"gnd", cathode:"pin5"` → `problems` містить `reversed`; `resistor:"none"` → `no-resistor`; `runLoops([{start:0,cond:"<3",step:"i++",body:"on(i)"}]).events.map(e=>e.i)` → `[0,1,2]`; `checkTask("bounce", runLoops([{0,"<3","i++"},{2,">=0","i--"}]).events)` → `true`; `cond:"<=3"` → `problems` містить `index-out-of-range` і остання подія `missing:true`; `{start:0,cond:">=0",step:"i++"}` → `infinite:true`, `iterations === 50`; `trafficLightSteps()` має 5 кроків, перший `seconds:3` і текст містить «зелен», останній `seconds:1`; `PINS` = `{red:7, yellow:6, green:5}`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5:** Commit: `feat(boards): модуль leds — перевірка схеми, конструктор циклу, світлофор`.

### Task 5: Урок 12 — сторінка учня і учительська картка

**Files:**
- Create: `lessons/12-boards-leds-loops/index.html`, `lessons/12-boards-leds-loops/teacher.html`
- Modify: `lessons.js` (num 12, tags `["Arduino","макетна плата","цикл for"]`), `data/teacher-plans.js` (`"boards:12"`), `tests/lessons/boards-pages.test.js` (кейс)

**Interfaces:** Consumes `Boards.leds`, `Lesson.*`. Вкладки: `theory`, `wiring` (`data-break="5"`), `loop` (`data-break="6"`), `traffic`, `quiz-tab`, `final`.

- [ ] **Step 1: Test:** `loadPage("12-boards-leds-loops")`: вкладки ↔ секції; `[data-max] >= 1 + 2 + 1 + 4` (схема 1, завдання циклу 2, світлофор 1, вікторина 4); у `#wiring` три `<select>` з id `w-anode`, `w-cathode`, `w-resistor`; у `#loop` елементи `.led` рівно 3; футер містить `лаб 2.pdf`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement сторінку:** теорія (макетка: SVG із шинами + і −, вертикальні групи; анод/катод; 220 Ом; синтаксис `for` із лаби); «Підключи світлодіод» (три списки → «Перевірити» → `checkWiring`; бал за `ok`; пояснення для кожного коду з словника на сторінці; «Спробувати ще раз» скидає бал); «Конструктор циклу» (для 1–2 циклів списки `start` 0..2, `cond`, `step`, `body`; код циклу показується; «Запустити» програє `events` на 3 `.led` з інтервалом 400 мс, `missing` → підпис «світлодіода i немає»; `infinite` → повідомлення; перемикач завдань `TASKS`, «Перевірити завдання» → `checkTask` → бал; вільний режим без балів); «Світлофор по порядку» (кроки `trafficLightSteps()` перемішані; кнопки ▲/▼; «Перевірити» → бал за точний порядок; показ пінів `PINS`); вікторина 4 питання.
- [ ] **Step 4: Картка** `"boards:12"`: timeline 45 (hook 3, theory 7, break схема 5 projector, break цикл 6, practice лаба 2 на платі 16, discuss 4, wrap 4); ресурси: PDF лаби 2 (`verified`), довідка Arduino `for`, Tinkercad Circuits (перевірити).
- [ ] **Step 5: Run** `npm test` → PASS; ручна перевірка в браузері. **Step 6:** Commit: `feat(boards): урок 12 — макетна плата, цикл for, світлофор`.

### Task 6: Модуль `shield` + урок 13

**Files:**
- Create: `assets/boards/shield.js`, `tests/boards/shield.test.js`, `lessons/13-boards-sensor-shield/index.html`, `lessons/13-boards-sensor-shield/teacher.html`
- Modify: `lessons.js` (num 13, tags `["Arduino","Sensor Shield","датчики"]`), `data/teacher-plans.js` (`"boards:13"`), `tests/lessons/boards-pages.test.js`

**Interfaces:**
- Produces `window.Boards.shield`: `PIN_GROUPS: [{id, label, pins: string[], kind: "digital"|"pwm"|"analog"|"power"|"i2c"|"uart", note}]` (не менше 6 груп; ШІМ-піни 3, 5, 6, 9, 10, 11 у групі `pwm`; аналогові A0–A5; I2C SDA/SCL (A4/A5 на UNO); UART 0/1; живлення 5V/3.3V/GND/VIN); `MODULES: [{id, name, io: "input"|"output"|"both", connector: kind}]` (12 модулів: кнопка, потенціометр, зумер, RGB-світлодіод, датчик вібрації, геркон, датчик Холла, датчик лінії, датчик звуку, енкодер, сервопривід, LCD I2C); `matchModule(moduleId, kind)` → `{ok, why}`; `KIND_LABELS: kind → підпис українською`. Факти про роз'єми V5 перевірити по PDF `rp/LAB_2/лаб 1.pdf` і довідці (WebFetch); не додавати роз'ємів, яких немає.

- [ ] **Step 1: Tests:** `PIN_GROUPS.find(g=>g.kind==="pwm").pins` містить `"3","5","6","9","10","11"`; `MODULES.length >= 12`, кожен має допустимі `io` і `connector`, що є у `KIND_LABELS`; `matchModule("servo","pwm").ok === true`, `matchModule("lcd-i2c","analog").ok === false` і `why` непорожній; сторінка: `loadPage("13-boards-sensor-shield")` — вкладки ↔ секції, `#map` містить `svg` і стільки `button[data-group]`, скільки `PIN_GROUPS`; `[data-max] >= 12 + 12 + 3`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** модуль і сторінку: теорія (навіщо шилд, G-V-S); «Карта плати» (SVG-схема з групами `<g data-group>` + кнопки-легенда; клік/фокус підсвічує групу, показує `note`; без балів); «Який роз'єм?» (`Lesson.match`: options = `KIND_LABELS`, items = `MODULES` → `connector`); «Вхід чи вихід?» (`Lesson.sort`: choices «Датчик (вхід)», «Пристрій виводу», «І те, і те»); вікторина 3 питання (G-V-S; `~`; куди LCD I2C).
- [ ] **Step 4: Картка** `"boards:13"`: timeline 45 (hook 3, theory 8, break карта 5 projector, practice match+sort 14, practice «підключи модуль до шилда наживо» 8, discuss 4, wrap 3); ресурси: `rp/LAB_2/лаб 1.pdf`, довідка Arduino по `analogWrite` (список ШІМ-пінів).
- [ ] **Step 5: Run** `npm test` → PASS; ручна перевірка. **Step 6:** Commit: `feat(boards): урок 13 — карта Sensor Shield V5, роз'єми й модулі`.

### Task 7: Модуль `lab` + урок 14

**Files:**
- Create: `assets/boards/lab.js`, `tests/boards/lab.test.js`, `lessons/14-boards-lab-day/index.html`, `lessons/14-boards-lab-day/teacher.html`
- Modify: `lessons.js` (num 14, tags `["лабораторна","безпека","звіт"]`), `data/teacher-plans.js` (`"boards:14"`), `tests/lessons/boards-pages.test.js`

**Interfaces:**
- Produces `window.Boards.lab`: `CHECKLIST: [{id, text, why}]` (8–10 пунктів); `REPORT_FIELDS: [{id, label, placeholder, required: boolean}]` (мета, компоненти, схема словами, ключові рядки коду, спостереження, що пішло не так і як виправили, висновок); `buildReport(fields: {id → string})` → рядок: заголовок `Звіт з лабораторної роботи`, далі блоки `Назва розділу:\n<текст>` лише для непорожніх полів; `gradeReport(fields)` → `{missing: string[] /* labels обов'язкових порожніх */, hints: string[]}`; `TROUBLES: [{symptom, cause, fix}]` (6 пунктів) для `Lesson.match`.

- [ ] **Step 1: Tests:** `buildReport({goal:"Блимати", code:""})` містить «Мета:» і «Блимати», не містить «Код»; `gradeReport({})` → `missing` містить усі `required` labels; `CHECKLIST.length >= 8`, у кожного `why` непорожній; `TROUBLES.length >= 6`; сторінка `loadPage("14-boards-lab-day")`: вкладки ↔ секції; `#checklist input[type=checkbox]` стільки, скільки `CHECKLIST`; кнопка `#power-on` є `disabled` на старті; `#report-out` існує; `[data-max] >= TROUBLES.length`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** Вкладки: `checklist` («Перед стартом»: чекбокси; кнопка «Можна вмикати живлення» активна лише коли всі відмічені; «чому» розкривається кліком; варіант балів — за рішенням будівельника, зафіксувати у звіті), `log` («Під час роботи»: поле + «Додати запис» → список із часом `HH:MM`, локально), `report` («Звіт»: форма з `REPORT_FIELDS` → «Зібрати звіт» → `buildReport` у `.out`, підказки `gradeReport` у `.fb`, «Копіювати» як у `14-ai-video`), `troubles` («Типові збої»: `Lesson.match` симптом → причина), `final`.
- [ ] **Step 4: Картка** `"boards:14"`: пояснення, що лаба LAB_2 № 1 перенесена в 11 клас, а урок проводиться як лабораторний день із самостійними завданнями лаб 1–2 («підберіть затримку», «вогник туди-назад»); timeline 45 (hook 3, break чекліст 5 projector, practice робота на платі 25 з посиланням `#log`, practice звіт 8 `#report`, wrap 4); ресурси: PDF лаб 1 і 2.
- [ ] **Step 5: Run** `npm test` → PASS; ручна перевірка. **Step 6:** Commit: `feat(boards): урок 14 — лабораторний день: чекліст, лог, звіт, типові збої`.

### Task 8: Модуль `rgb` + сцена «куб RGB»

**Files:**
- Create: `assets/boards/rgb.js`, `tests/boards/rgb.test.js`, `assets/scenes/rgb-cube.js`, `assets/scenes/rgb-cube.svg`

**Interfaces:**
- Produces `window.Boards.rgb`: `PINS = {r:6, g:3, b:5}`; `clamp(v)` → ціле 0..255; `toCss({r,g,b})` → `"rgb(r, g, b)"` з обрізаними значеннями; `toSketch({r,g,b})` → три рядки `analogWrite(6, r);\nanalogWrite(3, g);\nanalogWrite(5, b);` (порядок R, G, B; піни з `PINS`); `TARGETS = [{id, name, value:{r,g,b}}]` — оранжевий `{255,128,0}`, жовтий `{255,255,0}`, блакитний `{0,255,255}`, фіолетовий `{128,0,255}`, білий `{255,255,255}`; `TOLERANCE = 40`; `matches(target, value)` → `boolean` (кожен канал у межах ±`TOLERANCE` після `clamp`); `hint(target, value)` → рядок на кшталт «Більше червоного, менше синього» або `""`; `dutyCycle(v)` → `{ratio: 0..1, percent: "NN %"}`.
- Produces `window.RgbCube` (із `assets/scenes/rgb-cube.js`, ES-модуль, через `mountScene(".rgb-scene", …)`): `setColor({r,g,b})` переміщує кульку в кубі (координати `v/255`), `moves`/кнопки: «Обертати» (вмикає/вимикає автообертання), «Скинути вигляд»; `describe` — текстовий опис. Якщо сцена не змонтувалась, `window.RgbCube` відсутній — сторінка перевіряє наявність.

- [ ] **Step 1: Tests (rgb):** `toSketch({r:255,g:128,b:0})` → рівно `"analogWrite(6, 255);\nanalogWrite(3, 128);\nanalogWrite(5, 0);"`; `toSketch({r:300,g:-1,b:"7"})` → значення 255, 0, 7; `matches(orange, {r:230,g:150,b:30})` → `true`; `{r:200,…}` → `false`; `hint(orange, {r:100,g:128,b:0})` містить «червон»; `dutyCycle(64).percent === "25 %"`, `dutyCycle(255).ratio === 1`; `TARGETS.length === 5`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `rgb.js`, потім сцену (куб із ребрами `LineSegments`, підписи осей простими спрайтами або кольоровими ребрами: вісь R червона, G зелена, B синя; кулька `SphereGeometry` ≤ 32 сегментів, матеріал `MeshBasicMaterial` з кольором = поточному; камера з ізометричного ракурсу; `update` повертає `true` лише під час обертання) і `rgb-cube.svg` (ізометричний куб з підписами R/G/B і точкою). Переконатися, що без `three` (`file://`) `mountScene` показує fallback (логіка вже є в `scene.js`).
- [ ] **Step 4: Run** `npm test -- rgb` → PASS. **Step 5:** Commit: `feat(boards): модуль rgb і сцена «куб RGB»`.

### Task 9: Урок 15 — сторінка учня і учительська картка

**Files:**
- Create: `lessons/15-boards-rgb/index.html`, `lessons/15-boards-rgb/teacher.html`
- Modify: `lessons.js` (num 15, tags `["Arduino","RGB","ШІМ"]`), `data/teacher-plans.js` (`"boards:15"`), `tests/lessons/boards-pages.test.js`

**Interfaces:** Consumes `Boards.rgb`, `window.RgbCube?`, `Lesson.*`. Вкладки: `theory`, `mixer` (`data-break="6"`), `targets`, `pwm`, `quiz-tab`, `final`. `importmap` для `three` як у `14-ai-video`; `<script type="module" src="../../assets/scenes/rgb-cube.js">`.

- [ ] **Step 1: Test:** `loadPage("15-boards-rgb")` (модульні скрипти в jsdom не виконуються — ігнорувати): вкладки ↔ секції; три `input[type=range]` з id `rgb-r`, `rgb-g`, `rgb-b` (`min=0 max=255`); `#mixer` містить `.scene-fallback img[src$="rgb-cube.svg"]`; `[data-max] >= 5 + 3 + 4`; `#sketch-out` існує; футер містить `лаб 3.pdf`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement:** теорія (RGB зі спільним катодом, піни 6/3/5 через 220 Ом, ШІМ, `analogWrite 0..255`); «Змішувач» (повзунки з підписами «R → пін 6», «G → пін 3», «B → пін 5»; зразок кольору `background: toCss`; `#sketch-out` = `toSketch`; три смужки ШІМ з `dutyCycle`; виклик `window.RgbCube && window.RgbCube.setColor(...)` на кожну зміну; сцена `.rgb-scene` + `[data-scene-status]` + `.scene-fallback` як у 14-ai-video); «Підбери п'ять кольорів» (поточна ціль із `TARGETS`, «Перевірити» → `matches` → бал, інакше `hint`; «Далі» до наступної; «Почати знову» скидає бали); «Що бачить око?» (`Lesson.sort`: 25 % / 50 % / 100 % → тьмяно / середньо / яскраво, 3 пункти); вікторина 4 питання (діапазон `analogWrite`; які піни з `~`; чому спільний катод і куди він; що таке шпаруватість).
- [ ] **Step 4: Картка** `"boards:15"`: timeline 45 (hook 3, theory 7, break змішувач 6 projector, practice підбір кольорів 6, practice лаба 3 на платі 16, discuss 4, wrap 3); ресурси: PDF лаби 3 (`verified`), довідка Arduino `analogWrite` (перевірити), пояснення ШІМ українською (перевірити, інакше без `verified`).
- [ ] **Step 5: Run** `npm test` → PASS; ручна перевірка в браузері: сцена рухає кульку, fallback при `file://`. **Step 6:** Commit: `feat(boards): урок 15 — змішувач RGB, ШІМ і куб кольорів`.

### Task 10: README, перевірка курсу й головної

**Files:**
- Modify: `README.md` (розділ «Модулі логіки `assets/boards/`», як запускати тести, як додати урок курсу «Розумні плати»), `tests/lessons/boards-pages.test.js` (перевірка, що всі 5 записів `boards` у `lessons.js` мають папку з `index.html` і `teacher.html`, а `data/teacher-plans.js` містить `boards:11..15` із сумою `min` 45)

- [ ] **Step 1:** Дописати тест реєстрації (вище). **Step 2: Run** → PASS (якщо FAIL — виправити дані). 
- [ ] **Step 3:** README: короткі розділи; оновити рядок про шляхи `documents/` (латинські назви) і `npm test`.
- [ ] **Step 4:** Ручний прогін: `python3 -m http.server 8080` у корені → головна `#boards` показує уроки 11–15 як готові; `teacher/index.html` → курс «Розумні плати» має кнопки «План» для 11–15 і посилання на PDF; кожен урок відкривається з `?projector`; урок 15 показує сцену; без інтернету — картинку. Записати результати у звіт.
- [ ] **Step 5:** Commit: `docs: README — модулі boards, тести, уроки 11–15`.

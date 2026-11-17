import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Виконує файл репозиторію у вікні jsdom (window.Boards, window.Lesson тощо).
export function loadScript(window, relPath) {
  const code = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  window.eval(code + "\n//# sourceURL=" + relPath);
}

// Створює jsdom зі сторінки lessons/<folder>/index.html без мережі:
// відносні <script src> підставляються вмістом файлів, type="module" пропускаються.
// Аргумент, що закінчується на .html, — шлях сторінки від кореня (наприклад "taskbook/index.html").
export function loadPage(pageOrFolder) {
  const rel = /\.html$/i.test(pageOrFolder) ? pageOrFolder : "lessons/" + pageOrFolder + "/index.html";
  const pageFile = path.join(ROOT, rel);
  const pageDir = path.dirname(pageFile);
  let html = fs.readFileSync(pageFile, "utf8");
  html = html.replace(/<script\b([^>]*)>\s*<\/script>/gi, (tag, attrs) => {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (!src || /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(src[1])) return src ? "" : tag;
    if (/\btype\s*=\s*["']module["']/i.test(attrs)) return "";
    const file = path.resolve(pageDir, src[1].split(/[?#]/)[0]);
    return "<script>" + fs.readFileSync(file, "utf8").replace(/<\/script/gi, "<\\/script") + "</script>";
  });
  return new Promise((resolve, reject) => {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", reject); // необроблена помилка у скрипті сторінки валить тест
    const { window } = new JSDOM(html, { runScripts: "dangerously", virtualConsole, url: "http://localhost/" + (/\.html$/i.test(pageOrFolder) ? rel : "lessons/" + pageOrFolder + "/") });
    opened.push(window);
    if (window.document.readyState === "complete") return resolve(window);
    window.addEventListener("load", () => resolve(window));
  });
}

// Закриває всі вікна, відкриті через loadPage (зупиняє таймери); викликати в afterEach.
const opened = [];
export function closePages() {
  while (opened.length) opened.pop().close();
}

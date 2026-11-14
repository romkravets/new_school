import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Виконує файл репозиторію у вікні jsdom (window.Boards, window.Lesson тощо).
export function loadScript(window, relPath) {
  const code = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  window.eval(code + "\n//# sourceURL=" + relPath);
}

// Створює jsdom зі сторінки lessons/<folder>/index.html без мережі:
// відносні <script src> підставляються вмістом файлів, type="module" пропускаються.
export function loadPage(folder) {
  const pageDir = path.join(ROOT, "lessons", folder);
  let html = fs.readFileSync(path.join(pageDir, "index.html"), "utf8");
  html = html.replace(/<script\b([^>]*)>\s*<\/script>/gi, (tag, attrs) => {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (!src || /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(src[1])) return src ? "" : tag;
    if (/\btype\s*=\s*["']module["']/i.test(attrs)) return "";
    const file = path.resolve(pageDir, src[1].split(/[?#]/)[0]);
    return "<script>" + fs.readFileSync(file, "utf8").replace(/<\/script/gi, "<\\/script") + "</script>";
  });
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/lessons/" + folder + "/" });
  const { window } = dom;
  return new Promise(resolve => {
    if (window.document.readyState === "complete") return resolve(window);
    window.addEventListener("load", () => resolve(window));
  });
}

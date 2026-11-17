// Перевіряє задачник: для кожної задачі й тесту запускає еталонний розв'язок у справжньому CPython
// і порівнює вивід з очікуваним тією ж логікою, що й у браузері (assets/py/compare.js).
// Запуск: npm run check-tasks
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (ctx, rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx, { filename: rel });

const win = {};
const ctx = vm.createContext({ window: win });
run(ctx, "assets/py/compare.js");
run(ctx, "data/taskbook/index.js");
const dataDir = path.join(ROOT, "data/taskbook");
for (const f of fs.readdirSync(dataDir).filter((n) => n.endsWith(".js") && n !== "index.js").sort()) {
  run(ctx, "data/taskbook/" + f);
}
const { compareOutput } = win.Py.compare;
const TB = win.TASKBOOK || {};

// JSON-значення -> літерал Python (рядки й числа з JSON валідні в Python; потрібні лише true/false/null).
function pyLiteral(v) {
  if (v === null) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  if (Array.isArray(v)) return "[" + v.map(pyLiteral).join(", ") + "]";
  if (typeof v === "object") return "{" + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ": " + pyLiteral(x)).join(", ") + "}";
  return JSON.stringify(v);
}

let failed = 0, total = 0;
const topics = new Set([...(win.TASKBOOK_INDEX || []).map((t) => t.id), ...Object.keys(TB)]);
for (const topic of topics) {
  for (const task of TB[topic] || []) {
    const solFile = path.join(ROOT, "taskbook/solutions", topic, task.id + ".py");
    if (!fs.existsSync(solFile)) {
      failed++; total++;
      console.log(`✘ ${topic}/${task.id} — немає файлу розв'язку ${path.relative(ROOT, solFile)}`);
      continue;
    }
    const solution = fs.readFileSync(solFile, "utf8");
    task.tests.forEach((test, i) => {
      total++;
      const assigns = Object.entries(test.vars).map(([k, v]) => `${k} = ${pyLiteral(v)}`).join("\n");
      const r = spawnSync("python3", ["-I", "-c", assigns + "\n" + solution], { encoding: "utf8", timeout: 10000 });
      const label = `${topic}/${task.id} #${i + 1}`;
      if (r.status !== 0) {
        failed++;
        console.log(`✘ ${label} — помилка виконання:\n${r.stderr || r.error}`);
        return;
      }
      const res = compareOutput(test.out, r.stdout, task.tolerance);
      if (res.ok) console.log(`✔ ${label}`);
      else {
        failed++;
        console.log(`✘ ${label} (рядок ${res.line})\n  очікувано: ${JSON.stringify(res.expected)}\n  отримано:  ${JSON.stringify(res.actual)}`);
      }
    });
  }
}
console.log(`\n${total - failed}/${total} пройдено`);
process.exit(failed ? 1 : 0);

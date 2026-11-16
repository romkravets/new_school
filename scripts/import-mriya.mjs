import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const documentsDir = path.join(root, "documents");
const dataDir = path.join(root, "data");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "programs.js"), "utf8"), context);
const programs = context.window.PROGRAMS;
const archiveEntries = new Map();

function unzip(file, entry) {
  if (!archiveEntries.has(file)){
    const entries = execFileSync("unzip", ["-Z1", file], { encoding: "utf8" }).split(/\r?\n/);
    archiveEntries.set(file, new Set(entries));
  }
  if (!archiveEntries.get(file).has(entry)) return "";
  try {
    return execFileSync("unzip", ["-p", file, entry], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    if (error.status === 11) return "";
    throw new Error(`Не вдалося прочитати ${entry} у ${path.relative(root, file)}: ${error.message}`);
  }
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function attr(xml, name) {
  const escaped = name.replace(":", "\\:");
  const match = xml.match(new RegExp(`(?:^|\\s)${escaped}="([^"]*)"`));
  return match ? decodeXml(match[1]) : "";
}

function textNodes(xml) {
  return Array.from(xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g), (match) => decodeXml(match[1]));
}

function parseWorkbook(file) {
  const workbook = unzip(file, "xl/workbook.xml");
  const rels = unzip(file, "xl/_rels/workbook.xml.rels");
  const sheet = workbook.match(/<sheet\b[^>]*\/?>/);
  if (!sheet) throw new Error(`У файлі немає аркуша: ${path.relative(root, file)}`);
  const relationshipId = attr(sheet[0], "r:id");
  const relationship = Array.from(rels.matchAll(/<Relationship\b[^>]*\/?>/g))
    .find((match) => attr(match[0], "Id") === relationshipId);
  if (!relationship) throw new Error(`Не знайдено аркуш у ${path.relative(root, file)}`);

  const target = attr(relationship[0], "Target").replace(/^\/?xl\//, "");
  const sheetPath = path.posix.normalize(`xl/${target}`);
  const sharedXml = unzip(file, "xl/sharedStrings.xml");
  const sharedStrings = Array.from(sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g),
    (match) => textNodes(match[1]).join(""));
  const sheetXml = unzip(file, sheetPath);
  const rows = [];

  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = {};
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const reference = attr(cellMatch[1], "r");
      const column = reference.replace(/\d/g, "");
      if (!["A", "B", "C"].includes(column)) continue;
      const type = attr(cellMatch[1], "t");
      const body = cellMatch[2] || "";
      const value = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/);
      if (type === "s" && value) row[column] = sharedStrings[Number(value[1])] || "";
      else if (type === "inlineStr") row[column] = textNodes(body).join("");
      else row[column] = value ? decodeXml(value[1]) : "";
    }
    if (row.B && row.A !== "№") rows.push(row);
  }
  return rows;
}

function cleanTitle(title) {
  return title
    .replace(/^Інструктаж\s+з\s+БЖД\.\s*/i, "")
    .replace(/^Правила\s+поведінки\s+та\s+безпеки\s+життєдіяльності[^.]*\.\s*/i, "")
    .trim();
}

function readProgram(program) {
  const topics = [];
  program.sources.forEach((source, sourceIndex) => {
    const file = path.join(documentsDir, source);
    if (!fs.existsSync(file)) throw new Error(`Не знайдено календарний файл: documents/${source}`);
    const semester = sourceIndex + 1;
    for (const row of parseWorkbook(file)) {
      const title = cleanTitle(row.B || "");
      if (!title) continue;
      topics.push({
        num: topics.length + 1,
        semester,
        title,
        homework: (row.C || "").trim()
      });
    }
  });
  return topics;
}

fs.mkdirSync(dataDir, { recursive: true });
for (const program of programs) {
  if (program.externalTopics) {
    const outputPath = path.join(dataDir, `${program.id}.js`);
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Не знайдено окремий файл курсу: data/${program.id}.js`);
    }
    console.log(`${program.id}: окремий навчальний план збережено`);
    continue;
  }
  const topics = readProgram(program);
  const output = `window.TOPICS = window.TOPICS || {};\nwindow.TOPICS.${program.id} = ${JSON.stringify(topics, null, 2)};\n`;
  fs.writeFileSync(path.join(dataDir, `${program.id}.js`), output);
  const counts = [1, 2].map((semester) => topics.filter((topic) => topic.semester === semester).length);
  console.log(`${program.id}: І семестр — ${counts[0]}, ІІ семестр — ${counts[1]}, разом — ${topics.length}`);
}

#!/usr/bin/env node
/**
 * Simple utility to convert every sheet of an Excel workbook into a CSV file.
 * Usage: node scripts/excel-to-csv.js /path/to/workbook.xlsx
 *
 * Each sheet will be written into `data/<sheetname>.csv` (sheet names are
 * sanitized to safe file names). Existing files are overwritten.
 *
 * Install dependencies first:
 *   npm install xlsx --save-dev
 *
 * This script can run on Windows, macOS, Linux. It uses only built-in fs/path
 * and the `xlsx` package for parsing.
 */

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

if (process.argv.length < 3) {
  console.error("Usage: node scripts/excel-to-csv.js /path/to/file.xlsx");
  process.exit(1);
}

const workbookPath = path.resolve(process.argv[2]);
if (!fs.existsSync(workbookPath)) {
  console.error(`Workbook not found: ${workbookPath}`);
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const wb = xlsx.readFile(workbookPath, { cellDates: true });

function shouldSkipSheet(sheetName) {
  const normalized = String(sheetName || "").trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "codebook") return true;
  if (normalized === "inicio") return true;
  if (normalized.startsWith("tbl_")) return true;
  return false;
}

for (const sheetName of wb.SheetNames) {
  if (shouldSkipSheet(sheetName)) {
    console.log(`Skipped ${sheetName}`);
    continue;
  }

  const sheet = wb.Sheets[sheetName];

  // If the workbook contains an Excel table with the same name as the sheet,
  // export only that table's range. This ensures extraneous content outside
  // the formatted table (notes, formulas, etc.) is ignored.
  // Prefer an explicit table range when available, otherwise use sheet used range.
  const wbTables = (wb.Workbook && wb.Workbook.Tables) || [];
  const matching = wbTables.filter((t) => t.name === sheetName);
  const range = matching.length > 0 ? matching[0].ref : undefined;

  // Convert to array-of-rows so we can trim empty rows and empty columns
  // (leading/trailing empty columns were causing the ";;;" you observed).
  const rows = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    range: range,
  });

  // If there are no rows, write an empty file and continue.
  if (!rows || rows.length === 0) {
    const emptyFile = path.join(outDir, `${sheetName.replace(/[\\/:*?"<>|]/g, "_")}.csv`);
    fs.writeFileSync(emptyFile, "", "utf8");
    console.log(`Wrote ${emptyFile} (${sheetName})`);
    continue;
  }

  // Determine first/last column index that contain any non-empty value
  let firstCol = Infinity;
  let lastCol = -1;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        if (c < firstCol) firstCol = c;
        if (c > lastCol) lastCol = c;
      }
    }
  }

  if (firstCol === Infinity) {
    // sheet only contains empty cells in the chosen range
    const emptyFile = path.join(outDir, `${sheetName.replace(/[\\/:*?"<>|]/g, "_")}.csv`);
    fs.writeFileSync(emptyFile, "", "utf8");
    console.log(`Wrote ${emptyFile} (${sheetName})`);
    continue;
  }

  // Trim columns to the detected non-empty span and drop fully-empty rows
  const trimmed = rows
    .map((row) => {
      const r = row || [];
      return r.slice(firstCol, lastCol + 1);
    })
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""));

  // Convert rows to semicolon-delimited CSV with basic quoting
  const csv = trimmed
    .map((row) =>
      row
        .map((cell) => {
          const s = cell == null ? "" : String(cell);
          const escaped = s.replace(/"/g, '""');
          if (escaped.includes(";") || escaped.includes("\n") || escaped.includes('"')) {
            return `"${escaped}"`;
          }
          return escaped;
        })
        .join(";")
    )
    .join("\n");

  // sanitize sheetName for filename
  const safe = sheetName.replace(/[\\/:*?"<>|]/g, "_").trim() || "sheet";
  const fileName = path.join(outDir, `${safe}.csv`);
  fs.writeFileSync(fileName, csv, "utf8");
  console.log(`Wrote ${fileName} (${sheetName})`);
}

console.log("Conversion complete.");

// PALMS Excel 解析（幹部上傳中心區報表）
// ⚠️ 欄位名稱以常見 PALMS 匯出格式的別名寬鬆比對；拿到富禮實際報表後請校準 HEADER_ALIASES
import ExcelJS from "exceljs";

export interface ParsedPalmsRow {
  memberName: string;
  absences: number;
  lates: number;
  referralsIn: number;
  referralsOut: number;
  visitors: number;
  oneToOnes: number;
  ceu: number;
  tyfcb: number;
}

const HEADER_ALIASES: Record<keyof Omit<ParsedPalmsRow, "memberName">, string[]> = {
  absences: ["a", "absent", "缺席", "缺"],
  lates: ["l", "late", "遲到"],
  referralsIn: ["ri", "rri", "收到引薦", "引薦收"],
  referralsOut: ["rgi", "rgo", "r", "給出引薦", "引薦給", "引薦"],
  visitors: ["v", "visitor", "來賓", "訪客"],
  oneToOnes: ["121", "1-2-1", "o2o", "一對一", "1對1"],
  ceu: ["ceu", "培訓", "教育學分"],
  tyfcb: ["tyfcb", "感謝金額", "業績", "感謝"],
};
const NAME_ALIASES = ["name", "姓名", "成員", "會員"];

function normalize(s: unknown): string {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

export async function parsePalmsExcel(buffer: ArrayBuffer): Promise<{
  rows: ParsedPalmsRow[];
  warnings: string[];
}> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel 中找不到工作表");

  // 找標題列：第一個含「姓名」欄的列（前 10 列內）
  let headerRowIdx = -1;
  let nameCol = -1;
  const colMap = new Map<string, number>(); // fieldKey → col index
  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= row.cellCount; c++) {
      const v = normalize(row.getCell(c).value);
      if (NAME_ALIASES.includes(v)) {
        headerRowIdx = r;
        nameCol = c;
      }
    }
    if (headerRowIdx > 0) {
      for (let c = 1; c <= row.cellCount; c++) {
        const v = normalize(row.getCell(c).value);
        for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
          if (!colMap.has(key) && aliases.includes(v)) colMap.set(key, c);
        }
      }
      break;
    }
  }
  if (headerRowIdx < 0) {
    throw new Error("找不到標題列（需含「姓名」欄）。請確認檔案格式，或下載範本比對。");
  }

  const warnings: string[] = [];
  const missing = Object.keys(HEADER_ALIASES).filter((k) => !colMap.has(k));
  if (missing.length) {
    warnings.push(`以下欄位未在檔案中找到，將以 0 匯入：${missing.join("、")}`);
  }

  const rows: ParsedPalmsRow[] = [];
  for (let r = headerRowIdx + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = String(row.getCell(nameCol).value ?? "").trim();
    if (!name) continue;
    const num = (key: string): number => {
      const c = colMap.get(key);
      if (!c) return 0;
      const raw = row.getCell(c).value;
      const n = typeof raw === "object" && raw && "result" in raw ? Number(raw.result) : Number(raw);
      return Number.isFinite(n) ? n : 0;
    };
    rows.push({
      memberName: name,
      absences: num("absences"),
      lates: num("lates"),
      referralsIn: num("referralsIn"),
      referralsOut: num("referralsOut"),
      visitors: num("visitors"),
      oneToOnes: num("oneToOnes"),
      ceu: num("ceu"),
      tyfcb: num("tyfcb"),
    });
  }
  if (!rows.length) throw new Error("沒有解析到任何成員資料列");
  return { rows, warnings };
}

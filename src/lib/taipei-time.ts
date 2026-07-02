// 全站時間策略：分會活動固定發生在台灣，日期一律以台北時區的「當地日期字串」
// （YYYY-MM-DD）＋「當日分鐘數」表示，避免 UTC 換算錯誤。
// 系統時戳（createdAt 等）仍為 UTC DateTime，顯示時轉台北。

const TAIPEI_TZ = "Asia/Taipei";

/** 現在的台北當地日期 'YYYY-MM-DD' */
export function todayTaipei(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TAIPEI_TZ });
}

/** 現在的台北當地時間（當日分鐘數） */
export function nowMinutesTaipei(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TAIPEI_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const [h, m] = parts.split(":").map(Number);
  return h * 60 + m;
}

/** 日期字串加 n 天（純字串運算，與主機時區無關） */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** 該日期是星期幾（0=日..6=六） */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 分鐘數 → 'HH:MM' */
export function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 'M/D（週X）' 顯示，含今天/明天標記 */
export function fmtDate(dateStr: string, todayStr?: string): string {
  const DAY = ["日", "一", "二", "三", "四", "五", "六"];
  const [, m, d] = dateStr.split("-").map(Number);
  const base = `${m}/${d}（${DAY[weekdayOf(dateStr)]}）`;
  if (todayStr) {
    if (dateStr === todayStr) return `${base}今天`;
    if (dateStr === addDays(todayStr, 1)) return `${base}明天`;
  }
  return base;
}

/** 目前台北日期所屬季度，回傳 {year, quarter, startDate, endDate} */
export function currentQuarter(todayStr: string = todayTaipei()) {
  const [y, m] = todayStr.split("-").map(Number);
  const q = Math.floor((m - 1) / 3) + 1;
  const startMonth = (q - 1) * 3 + 1;
  const start = `${y}-${String(startMonth).padStart(2, "0")}-01`;
  const endMonth = startMonth + 2;
  const lastDay = new Date(Date.UTC(y, endMonth, 0)).getUTCDate();
  const end = `${y}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { year: y, quarter: q, startDate: start, endDate: end };
}

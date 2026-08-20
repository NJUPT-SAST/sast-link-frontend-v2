/** 两位补零（供本地时间格式化复用）。 */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * 本地日期时间 → RFC 3339 字符串（带秒与时区偏移，如 `2026-08-20T00:00:00+08:00`）。
 * 后端 /admin/audit-logs 的 start_time/end_time 为严格 RFC 3339（
 * time.Parse(time.RFC3339)），无秒或无偏移会被拒绝（40000）。
 */
export function toRfc3339Local(d: Date): string {
  const offsetMinutes = -d.getTimezoneOffset(); // east of UTC, minutes
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const tz = `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}${tz}`;
}

/** 本地时区日期 → YYYY-MM-DD（用于展示用户所选日）。 */
export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 加/减若干天（自动跨月）。 */
export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/**
 * RFC 3339 值 → 用户所选日（仅日期，时区无关：直接从字符串日期段构造，
 * 不经过 new Date(value) 的浏览器时区折算）。
 * endOfDay=true 表示该值存的是右开边界（次日 00:00），需回退一天还原用户点选的日期。
 */
export function toLocalVisibleDay(
  value: string | undefined,
  endOfDay = false,
): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  const day = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return endOfDay ? addDays(day, -1) : day;
}
/** 两位补零（供本地时间格式化复用）。 */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * 本地时区时间 → datetime-local 输入框值（YYYY-MM-DDTHH:mm）。
 * 供审计筛选的日期选择器与导出文件名构造共用，避免同一补零逻辑散落多处。
 */
export function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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
 * datetime-local 值 → 用户所选日（本地时区，仅日期）。
 * endOfDay=true 表示该值存的是右开边界（次日 00:00），需回退一天还原用户点选的日期。
 */
export function toLocalVisibleDay(
  value: string | undefined,
  endOfDay = false,
): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return endOfDay ? addDays(day, -1) : day;
}
// date math utilities
// nothing fancy here — just pure functions, easy to test in isolation

export function getDaysInMonth(year, month) {
  // passing 0 as the day gives the last day of the previous month, 
  // so month+1 with day 0 = last day of `month`
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  // JS gives 0=Sun, but we want 0=Mon for the grid
  // Sunday should appear in column 6 (last), so: Sun(0) -> 6, Mon(1) -> 0, etc.
  return day === 0 ? 6 : day - 1;
}

export function formatDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// converts a date object { year, month, day } to a sortable integer
// e.g. April 7 2026 -> 20260407
// using this instead of Date objects to avoid timezone weirdness
function toSortableNum(d) {
  return d.year * 10000 + d.month * 100 + d.day;
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  return toSortableNum(a) === toSortableNum(b);
}

export function compareDates(a, b) {
  // returns negative if a < b, 0 if equal, positive if a > b
  return toSortableNum(a) - toSortableNum(b);
}

export function isInRange(date, start, end) {
  if (!start || !end || !date) return false;
  const d = toSortableNum(date);
  const lo = Math.min(toSortableNum(start), toSortableNum(end));
  const hi = Math.max(toSortableNum(start), toSortableNum(end));
  return d > lo && d < hi;
}

export function isRangeStart(date, start, end) {
  if (!start || !end) return false;
  const d = toSortableNum(date);
  const lo = Math.min(toSortableNum(start), toSortableNum(end));
  return d === lo;
}

export function isRangeEnd(date, start, end) {
  if (!start || !end) return false;
  const d = toSortableNum(date);
  const hi = Math.max(toSortableNum(start), toSortableNum(end));
  return d === hi;
}

export function isToday(year, month, day) {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day
  );
}

export function countDaysInRange(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start.year, start.month, start.day);
  const b = new Date(end.year, end.month, end.day);
  const diffMs = Math.abs(b.getTime() - a.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function formatShortDate(dateObj) {
  if (!dateObj) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[dateObj.month]} ${dateObj.day}, ${dateObj.year}`;
}

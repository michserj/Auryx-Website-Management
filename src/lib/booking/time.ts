// Pure, dependency-free scheduling helpers (unit tested in tests/booking-time.test.ts).

export type Interval = { start: Date; end: Date };

export type SlotRules = {
  timezone: string;
  workDays: number[]; // 0 = Sunday … 6 = Saturday
  dayStart: string; // "HH:MM"
  dayEnd: string; // "HH:MM"
  durationMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Offset (minutes) of `tz` from UTC at the given instant. */
export function tzOffsetMinutes(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Converts a wall-clock date/time in `tz` to a UTC instant. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let result = guess - tzOffsetMinutes(new Date(guess), tz) * 60000;
  // Second pass handles DST transitions (not relevant for Asia/Manila, but keeps this generic).
  result = guess - tzOffsetMinutes(new Date(result), tz) * 60000;
  return new Date(result);
}

/** Calendar date (YYYY-MM-DD) of an instant in `tz`. */
export function dateInTz(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    instant,
  );
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function isValidDate(date: string) {
  if (!DATE_RE.test(date)) return false;
  const d = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

/** Candidate step between slot starts: at most 30 minutes, or the duration if shorter. */
export function slotStepMinutes(rules: Pick<SlotRules, "durationMinutes">) {
  return Math.min(30, rules.durationMinutes);
}

/** The first and last bookable calendar dates, given the rules and current time. */
export function bookableRange(rules: SlotRules, now: Date) {
  const today = dateInTz(now, rules.timezone);
  return { first: today, last: addDays(today, rules.maxDaysAhead) };
}

/**
 * Available slots for one date. A slot is offered when it:
 * - falls on a working day, entirely within working hours
 * - starts at least `minNoticeHours` from now and within `maxDaysAhead`
 * - does not overlap any busy interval once padded with the buffer on both sides
 */
export function generateSlots(date: string, rules: SlotRules, now: Date, busy: Interval[]): Interval[] {
  if (!isValidDate(date)) return [];
  if (!rules.workDays.includes(weekday(date))) return [];
  const { first, last } = bookableRange(rules, now);
  if (date < first || date > last) return [];

  const dayStart = zonedToUtc(date, rules.dayStart, rules.timezone);
  const dayEnd = zonedToUtc(date, rules.dayEnd, rules.timezone);
  const earliest = new Date(now.getTime() + rules.minNoticeHours * 3600_000);
  const durMs = rules.durationMinutes * 60_000;
  const bufMs = rules.bufferMinutes * 60_000;
  const stepMs = slotStepMinutes(rules) * 60_000;

  const slots: Interval[] = [];
  for (let t = dayStart.getTime(); t + durMs <= dayEnd.getTime(); t += stepMs) {
    const slot = { start: new Date(t), end: new Date(t + durMs) };
    if (slot.start < earliest) continue;
    const padded = { start: new Date(t - bufMs), end: new Date(t + durMs + bufMs) };
    if (busy.some((b) => overlaps(padded, b))) continue;
    slots.push(slot);
  }
  return slots;
}

export function isSlotAvailable(start: Date, rules: SlotRules, now: Date, busy: Interval[]) {
  const date = dateInTz(start, rules.timezone);
  return generateSlots(date, rules, now, busy).some((s) => s.start.getTime() === start.getTime());
}

export function formatInTz(instant: Date, tz: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...opts,
  }).format(instant);
}

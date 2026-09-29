import { describe, expect, it } from "vitest";
import { generateSlots, isSlotAvailable, zonedToUtc, dateInTz, type SlotRules } from "@/lib/booking/time";

const rules: SlotRules = {
  timezone: "Asia/Manila",
  workDays: [1, 2, 3, 4, 5],
  dayStart: "08:00",
  dayEnd: "17:00",
  durationMinutes: 30,
  bufferMinutes: 15,
  minNoticeHours: 24,
  maxDaysAhead: 30,
};
// Monday 2026-09-28 09:00 Manila
const now = new Date("2026-09-28T01:00:00Z");
const pht = (iso: string) => new Date(`${iso}+08:00`);

describe("time zone conversion", () => {
  it("converts Manila wall-clock time to UTC (UTC+8, no DST)", () => {
    expect(zonedToUtc("2026-10-01", "08:00", "Asia/Manila").toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(dateInTz(new Date("2026-09-30T16:30:00Z"), "Asia/Manila")).toBe("2026-10-01");
  });
});

describe("generateSlots", () => {
  it("offers Mon–Fri 08:00–17:00 PHT slots that end by 17:00", () => {
    const slots = generateSlots("2026-10-01", rules, now, []);
    expect(slots[0].start).toEqual(pht("2026-10-01T08:00:00"));
    expect(slots.at(-1)!.end).toEqual(pht("2026-10-01T17:00:00"));
    expect(slots).toHaveLength(18);
  });

  it("offers nothing on weekends", () => {
    expect(generateSlots("2026-10-03", rules, now, [])).toEqual([]); // Saturday
    expect(generateSlots("2026-10-04", rules, now, [])).toEqual([]); // Sunday
  });

  it("respects minimum notice", () => {
    const slots = generateSlots("2026-09-29", rules, now, []); // Tuesday, <24h for early slots
    expect(slots[0].start >= new Date(now.getTime() + 24 * 3600_000)).toBe(true);
    expect(slots[0].start).toEqual(pht("2026-09-29T09:00:00"));
  });

  it("respects the booking horizon and rejects invalid dates", () => {
    expect(generateSlots("2026-11-30", rules, now, [])).toEqual([]);
    expect(generateSlots("2026-02-30", rules, now, [])).toEqual([]);
    expect(generateSlots("nonsense", rules, now, [])).toEqual([]);
  });

  it("excludes busy times padded by the buffer", () => {
    const busy = [{ start: pht("2026-10-01T10:00:00"), end: pht("2026-10-01T10:30:00") }];
    const times = generateSlots("2026-10-01", rules, now, busy).map((s) => s.start.toISOString());
    expect(times).not.toContain(pht("2026-10-01T09:30:00").toISOString()); // ends 10:00, buffer overlaps
    expect(times).not.toContain(pht("2026-10-01T10:00:00").toISOString());
    expect(times).not.toContain(pht("2026-10-01T10:30:00").toISOString()); // buffer overlaps
    expect(times).toContain(pht("2026-10-01T09:00:00").toISOString());
    expect(times).toContain(pht("2026-10-01T11:00:00").toISOString());
  });

  it("validates arbitrary requested start times", () => {
    expect(isSlotAvailable(pht("2026-10-01T08:00:00"), rules, now, [])).toBe(true);
    expect(isSlotAvailable(pht("2026-10-01T08:10:00"), rules, now, [])).toBe(false); // off-grid
    expect(isSlotAvailable(pht("2026-10-01T16:45:00"), rules, now, [])).toBe(false); // runs past 17:00
    expect(isSlotAvailable(pht("2026-10-01T07:30:00"), rules, now, [])).toBe(false);
  });
});

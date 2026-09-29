import "server-only";
import { log } from "../logger";
import type { Interval } from "./time";

export type CalendarEventInput = {
  summary: string;
  description: string;
  start: Date;
  end: Date;
  timezone: string;
  attendees: string[];
  addVideoLink: boolean;
};

export type CalendarEvent = { id: string; link?: string; start?: Date; end?: Date; cancelled?: boolean };

export interface CalendarProvider {
  readonly name: string;
  getBusy(range: Interval): Promise<Interval[]>;
  createEvent(input: CalendarEventInput): Promise<CalendarEvent | null>;
  updateEventTime(id: string, start: Date, end: Date, timezone: string): Promise<void>;
  cancelEvent(id: string): Promise<void>;
  getEvent(id: string): Promise<CalendarEvent | null>;
}

/* ------------------------------ Google Calendar ----------------------------- */
/**
 * Uses OAuth 2.0 with a long-lived refresh token for the Workspace account that
 * owns the consultation calendar (see README → Google Calendar setup).
 * Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_CALENDAR_ID
 */
class GoogleCalendar implements CalendarProvider {
  readonly name = "google";
  private token: { value: string; expires: number } | null = null;
  private calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID ?? "primary");

  private async accessToken() {
    if (this.token && this.token.expires > Date.now() + 60_000) return this.token.value;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error(`Google token refresh failed (${res.status})`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 };
    return this.token.value;
  }

  private async api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${await this.accessToken()}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Google Calendar ${init.method ?? "GET"} ${path.split("?")[0]} failed (${res.status})`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  async getBusy(range: Interval) {
    const data = await this.api<{ calendars: Record<string, { busy: { start: string; end: string }[] }> }>(
      "/freeBusy",
      {
        method: "POST",
        body: JSON.stringify({
          timeMin: range.start.toISOString(),
          timeMax: range.end.toISOString(),
          items: [{ id: decodeURIComponent(this.calendarId) }],
        }),
      },
    );
    return Object.values(data.calendars).flatMap((c) =>
      (c.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) })),
    );
  }

  async createEvent(input: CalendarEventInput) {
    const body: Record<string, unknown> = {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
      end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
      attendees: input.attendees.map((email) => ({ email })),
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      reminders: { useDefault: true },
    };
    if (input.addVideoLink) {
      body.conferenceData = {
        createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
      };
    }
    const ev = await this.api<{ id: string; htmlLink: string }>(
      `/calendars/${this.calendarId}/events?sendUpdates=all&conferenceDataVersion=1`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return { id: ev.id, link: ev.htmlLink };
  }

  async updateEventTime(id: string, start: Date, end: Date, timezone: string) {
    await this.api(`/calendars/${this.calendarId}/events/${encodeURIComponent(id)}?sendUpdates=all`, {
      method: "PATCH",
      body: JSON.stringify({
        start: { dateTime: start.toISOString(), timeZone: timezone },
        end: { dateTime: end.toISOString(), timeZone: timezone },
      }),
    });
  }

  async cancelEvent(id: string) {
    await this.api(`/calendars/${this.calendarId}/events/${encodeURIComponent(id)}?sendUpdates=all`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
  }

  async getEvent(id: string) {
    const ev = await this.api<{
      id: string;
      htmlLink: string;
      status: string;
      start?: { dateTime?: string };
      end?: { dateTime?: string };
    }>(`/calendars/${this.calendarId}/events/${encodeURIComponent(id)}`);
    return {
      id: ev.id,
      link: ev.htmlLink,
      cancelled: ev.status === "cancelled",
      start: ev.start?.dateTime ? new Date(ev.start.dateTime) : undefined,
      end: ev.end?.dateTime ? new Date(ev.end.dateTime) : undefined,
    };
  }
}

/* ------------------------------- Local fallback ----------------------------- */
/** Used when Google credentials are not configured (local development / demos). */
class LocalCalendar implements CalendarProvider {
  readonly name = "local";
  async getBusy() {
    return [];
  }
  async createEvent() {
    log.warn("calendar.local_mode", { note: "Google Calendar not configured; no event created" });
    return null;
  }
  async updateEventTime() {}
  async cancelEvent() {}
  async getEvent() {
    return null;
  }
}

export function isGoogleCalendarConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

let provider: CalendarProvider | null = null;
export function getCalendar(): CalendarProvider {
  if (!provider) provider = isGoogleCalendarConfigured() ? new GoogleCalendar() : new LocalCalendar();
  return provider;
}

import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { requireAdmin, totpFor } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { decrypt } from "@/lib/security";
import { getContent } from "@/lib/settings";
import { isGoogleCalendarConfigured } from "@/lib/booking/calendar";
import { emailSettingsStatus } from "@/lib/email";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Checkbox, Input, Panel, Textarea } from "@/components/admin/ui";
import { PASSWORD_RULE } from "@/lib/password-policy";
import {
  beginMfaSetup,
  changePassword,
  confirmMfa,
  disableMfa,
  runRetentionNow,
  saveBookingSettings,
  saveChatbotSettings,
  saveRetentionSettings,
  sendTestEmail,
  signOutEverywhere,
} from "../../actions/settings";

export const metadata = { title: "Settings" };
// Allows time for the test email to reach the mail server.
export const maxDuration = 60;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const db = await getDb();
  const [[user], booking, retention, chatbot] = await Promise.all([
    db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id)),
    getContent("booking"),
    getContent("retention"),
    getContent("chatbot"),
  ]);

  const email = emailSettingsStatus();
  let qr: string | null = null;
  let manualKey: string | null = null;
  if (user.totpSecretEnc && !user.totpEnabled) {
    manualKey = decrypt(user.totpSecretEnc);
    qr = await QRCode.toDataURL(totpFor(manualKey, user.email).toString(), { margin: 1, width: 200 });
  }

  return (
    <AdminPage title="Settings" description="Consultation booking, data retention, chatbot and account security.">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Consultation booking" className="xl:col-span-2">
          <p className="mb-4 text-sm text-muted">
            Calendar: {isGoogleCalendarConfigured() ? `Google Calendar (${process.env.GOOGLE_CALENDAR_ID ?? "primary"})` : "not connected, see README"}.
            Calendar credentials are configured via environment variables, never here.
          </p>
          <ActionForm action={saveBookingSettings}>
            <Checkbox label="Online booking enabled" name="enabled" defaultChecked={booking.enabled} />
            <fieldset>
              <legend className="field-label">Available days</legend>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((d, i) => (
                  <label key={d} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="workDays" value={i} defaultChecked={booking.workDays.includes(i)} className="h-4 w-4 accent-navy-600" />
                    {d}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Day starts" name="dayStart" type="time" defaultValue={booking.dayStart} required />
              <Input label="Day ends" name="dayEnd" type="time" defaultValue={booking.dayEnd} required />
              <Input label="Time zone" name="timezone" defaultValue={booking.timezone} required hint="IANA name, e.g. Asia/Manila" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Duration (minutes)" name="durationMinutes" type="number" min={15} max={240} defaultValue={booking.durationMinutes} required />
              <Input label="Buffer between meetings (minutes)" name="bufferMinutes" type="number" min={0} max={120} defaultValue={booking.bufferMinutes} required />
              <Input label="Minimum notice (hours)" name="minNoticeHours" type="number" min={0} max={336} defaultValue={booking.minNoticeHours} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Bookable days ahead" name="maxDaysAhead" type="number" min={1} max={180} defaultValue={booking.maxDaysAhead} required />
              <Input label="Visitor change cut-off (hours before)" name="changeCutoffHours" type="number" min={0} max={168} defaultValue={booking.changeCutoffHours} required />
            </div>
            <Textarea label="Notification recipients" name="notifyEmails" defaultValue={booking.notifyEmails.join("\n")} rows={3} hint="One email per line. Also added as attendees on the calendar event." />
            <Checkbox label="Add a Google Meet link to consultation events" name="addVideoLink" defaultChecked={booking.addVideoLink} />
          </ActionForm>
        </Panel>

        <Panel title="Email" className="xl:col-span-2">
          <dl className="mb-5 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Status</dt>
              <dd className={email.missing.length ? "font-medium text-orange-700" : "font-medium text-green-700"}>
                {email.missing.length ? `Not sending. Missing: ${email.missing.join(", ")}` : "Sending switched on"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Sends with account (SMTP_USER)</dt>
              <dd className="font-medium">{email.user ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted">Sender shown to recipients (EMAIL_FROM)</dt>
              <dd className="font-medium">{email.from}</dd>
            </div>
          </dl>
          <p className="mb-4 text-sm text-muted">
            Email settings are environment variables in Vercel (never stored here). After changing them, redeploy, then send a test
            email to confirm delivery. If it fails, the reason is shown below.
          </p>
          <ActionForm action={sendTestEmail} submitLabel="Send test email" variant="outline">
            <Input label="Send a test email to" name="to" type="email" defaultValue={user.email} required />
          </ActionForm>
        </Panel>

        <Panel title="Data retention">
          <p className="mb-4 text-sm text-muted">
            Business targets from the BA (chat 6 months; inquiries &amp; bookings 12 months). These are not a legal determination, so keep them
            consistent with the approved Privacy Notice.
          </p>
          <ActionForm action={saveRetentionSettings}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Chat (months)" name="chatMonths" type="number" min={1} max={120} defaultValue={retention.chatMonths} required />
              <Input label="Inquiries (months)" name="inquiryMonths" type="number" min={1} max={120} defaultValue={retention.inquiryMonths} required />
              <Input label="Bookings (months)" name="bookingMonths" type="number" min={1} max={120} defaultValue={retention.bookingMonths} required />
            </div>
          </ActionForm>
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-sm text-muted">
              The purge runs daily via the scheduled job{process.env.CRON_SECRET ? "" : " (not active: CRON_SECRET is not set)"}. You can also run it now.
            </p>
            <ActionForm action={runRetentionNow} submitLabel="Run retention purge now" variant="outline" confirm="Permanently delete all records older than the retention periods?" />
          </div>
        </Panel>

        <Panel title="Chat assistant">
          <ActionForm action={saveChatbotSettings}>
            <Checkbox label="Show the chat assistant on the website" name="enabled" defaultChecked={chatbot.enabled} />
            <Textarea label="Greeting message" name="greeting" defaultValue={chatbot.greeting} rows={3} required maxLength={500} />
          </ActionForm>
        </Panel>

        <Panel title="Account & password">
          <div className="mb-5 rounded-lg bg-surface p-3 text-sm">
            <p className="text-muted">Username</p>
            <p className="font-semibold">{user.email}</p>
            <p className="mt-1 text-xs text-muted">The username cannot be changed.</p>
          </div>
          <ActionForm action={changePassword} submitLabel="Change password">
            <input type="text" name="username" autoComplete="username" defaultValue={user.email} hidden readOnly />
            <Input label="Current password" name="current" type="password" autoComplete="current-password" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="New password" name="next" type="password" autoComplete="new-password" minLength={10} required hint={PASSWORD_RULE} />
              <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
            </div>
          </ActionForm>
        </Panel>

        <Panel title="Two-factor authentication (MFA)">
          {user.totpEnabled ? (
            <>
              <p className="mb-4 text-sm text-green-700">Enabled. An authenticator code is required at sign-in.</p>
              <ActionForm action={disableMfa} submitLabel="Disable MFA" variant="danger">
                <Input label="Confirm with your password" name="password" type="password" autoComplete="current-password" required />
              </ActionForm>
            </>
          ) : qr ? (
            <>
              <p className="mb-3 text-sm text-muted">Scan with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URL generated on the server */}
              <img src={qr} alt="QR code for authenticator app setup" width={200} height={200} className="rounded-lg border border-line" />
              <p className="mt-2 break-all font-mono text-xs text-muted">Manual key: {manualKey}</p>
              <ActionForm action={confirmMfa} submitLabel="Verify and enable" className="mt-4 space-y-4">
                <Input label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required />
              </ActionForm>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">Strongly recommended: protects the single Admin account even if the password leaks.</p>
              <ActionForm action={beginMfaSetup} submitLabel="Set up MFA" />
            </>
          )}
        </Panel>

        <Panel title="Sessions">
          <p className="mb-4 text-sm text-muted">Sign out of the Admin Dashboard on all devices and browsers.</p>
          <ActionForm action={signOutEverywhere} submitLabel="Sign out everywhere" variant="outline" confirm="Sign out on all devices?" />
        </Panel>
      </div>
    </AdminPage>
  );
}

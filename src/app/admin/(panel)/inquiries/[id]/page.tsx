import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiries";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Badge, Panel, Select, Textarea, fmtDate } from "@/components/admin/ui";
import { deleteInquiry, updateInquiry } from "../../../actions/inquiries";

export const metadata = { title: "Inquiry" };

export default async function InquiryPage(props: PageProps<"/admin/inquiries/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [inq] = await db.select().from(schema.inquiries).where(eq(schema.inquiries.id, id));
  if (!inq) notFound();

  return (
    <AdminPage
      title={`Inquiry from ${inq.name}`}
      description={`Received ${fmtDate(inq.createdAt)}`}
      actions={
        <Link href="/admin/inquiries" className="btn-outline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All inquiries
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Message" className="lg:col-span-2">
          <p className="whitespace-pre-wrap leading-relaxed">{inq.message}</p>
        </Panel>
        <div className="space-y-6">
          <Panel title="Contact details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="font-medium">{inq.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="font-medium">{inq.email ? <a className="text-navy-700 hover:underline" href={`mailto:${inq.email}`}>{inq.email}</a> : "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-muted">Contact number</dt>
                <dd className="font-medium">{inq.phone ? <a className="text-navy-700 hover:underline" href={`tel:${inq.phone}`}>{inq.phone}</a> : "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd><Badge kind={inq.status}>{INQUIRY_STATUS_LABEL[inq.status]}</Badge></dd>
              </div>
              <div>
                <dt className="text-muted">Privacy acknowledgment</dt>
                <dd>{fmtDate(inq.privacyAckAt)} · notice {inq.privacyNoticeVersion}</dd>
              </div>
              <div>
                <dt className="text-muted">Email notification</dt>
                <dd>{inq.emailSentAt ? `Sent ${fmtDate(inq.emailSentAt)}` : inq.emailError ? <span className="text-orange-700">Failed, please follow up from here</span> : "Pending / not configured"}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Manage">
            <ActionForm action={updateInquiry}>
              <input type="hidden" name="id" value={inq.id} />
              <Select
                label="Status"
                name="status"
                defaultValue={inq.status}
                options={schema.inquiryStatus.map((s) => ({ value: s, label: INQUIRY_STATUS_LABEL[s] }))}
              />
              <Textarea label="Internal notes" name="adminNotes" defaultValue={inq.adminNotes} rows={4} maxLength={5000} />
            </ActionForm>
          </Panel>
          <Panel title="Delete">
            <p className="mb-4 text-sm text-muted">Permanently delete this inquiry (e.g. on a data-subject erasure request).</p>
            <ActionForm action={deleteInquiry} submitLabel="Delete inquiry" variant="danger" confirm="Permanently delete this inquiry?">
              <input type="hidden" name="id" value={inq.id} />
            </ActionForm>
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
}

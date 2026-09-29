"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getDb, schema } from "@/lib/db";
import { BookingError, cancelBooking } from "@/lib/booking/service";
import type { ActionResult } from "@/components/admin/ActionForm";

export async function adminCancelBooking(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return { ok: false, message: "Invalid input." };
  try {
    await cancelBooking(id.data, "admin");
  } catch (err) {
    return { ok: false, message: err instanceof BookingError ? err.message : "Could not cancel the booking." };
  }
  await audit(admin.email, "booking.cancel", "booking", id.data);
  revalidatePath("/admin/bookings");
  return { ok: true, message: "Cancelled. The visitor and team have been notified." };
}

export async function deleteBooking(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return { ok: false, message: "Invalid input." };
  const db = await getDb();
  await db.delete(schema.bookings).where(eq(schema.bookings.id, id.data));
  await audit(admin.email, "booking.delete", "booking", id.data);
  revalidatePath("/admin/bookings");
  return { ok: true, message: "Booking record deleted." };
}

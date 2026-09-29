import { describe, expect, it } from "vitest";
import { bookingSchema, contactSchema } from "@/lib/validation";

const validContact = { name: "Juan", message: "Hello there, we need help.", privacyAck: true as const };

describe("contact form validation", () => {
  it("accepts name + message only (email and phone optional)", () => {
    expect(contactSchema.safeParse(validContact).success).toBe(true);
    expect(contactSchema.safeParse({ ...validContact, email: "", phone: "" }).success).toBe(true);
  });

  it("requires name, message and the privacy acknowledgment", () => {
    expect(contactSchema.safeParse({ ...validContact, name: "  " }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validContact, message: "" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validContact, privacyAck: false }).success).toBe(false);
  });

  it("validates optional fields when present", () => {
    expect(contactSchema.safeParse({ ...validContact, email: "nope" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validContact, phone: "abc" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validContact, phone: "+63 917 123 4567" }).success).toBe(true);
  });

  it("rejects oversized input and filled honeypots", () => {
    expect(contactSchema.safeParse({ ...validContact, message: "x".repeat(5001) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validContact, website: "spam" }).success).toBe(false);
  });
});

describe("booking validation", () => {
  const valid = {
    start: "2026-10-01T00:00:00.000Z",
    name: "Ana",
    email: "ana@example.test",
    phone: "09171234567",
    privacyAck: true as const,
  };
  it("requires name, email, contact number, slot and acknowledgment", () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
    for (const k of ["start", "name", "email", "phone"] as const) {
      expect(bookingSchema.safeParse({ ...valid, [k]: "" }).success).toBe(false);
    }
    expect(bookingSchema.safeParse({ ...valid, privacyAck: false }).success).toBe(false);
  });
});

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const SERVICE_REVIEW_COOKIE = "masanawa_service_review";
export const SERVICE_REVIEW_MAX_AGE_SECONDS = 5 * 60;

export type ServiceReview = {
  kind: "airtime" | "data" | "electricity" | "cable" | "gift_card" | "telegram";
  recipient: string;
  productCode: string;
  amountMinor: number;
  returnTo: string;
  expiresAt: number;
};

function signingKey() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Service review signing is not configured.");
  return createHmac("sha256", secret).update("masanawa:service-review:v1").digest();
}

function signature(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function createServiceReviewToken(review: Omit<ServiceReview, "expiresAt">) {
  const payload = Buffer.from(JSON.stringify({
    ...review,
    expiresAt: Date.now() + SERVICE_REVIEW_MAX_AGE_SECONDS * 1000,
  })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function readServiceReviewToken(token: string | undefined): ServiceReview | null {
  if (!token) return null;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<ServiceReview>;
    if (!value.kind || !value.recipient || !value.productCode || !value.returnTo) return null;
    if (!Number.isSafeInteger(value.amountMinor) || Number(value.amountMinor) < 0) return null;
    if (!Number.isSafeInteger(value.expiresAt) || Number(value.expiresAt) <= Date.now()) return null;
    return value as ServiceReview;
  } catch {
    return null;
  }
}

'use server';

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

const allowedMime = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);
const allowedTypes = new Set(["nin_slip","passport","drivers_license","voters_card","other"]);

export async function uploadKycDocument(formData: FormData) {
  const documentType = String(formData.get("document_type") ?? "").trim();
  const file = formData.get("document");
  if (!allowedTypes.has(documentType) || !(file instanceof File) || file.size <= 0) {
    redirect(`/profile/verification?error=${encodeURIComponent("Choose a valid identity document.")}`);
  }
  if (file.size > 5 * 1024 * 1024) redirect(`/profile/verification?error=${encodeURIComponent("KYC documents must be 5 MB or smaller.")}`);
  const extension = allowedMime.get(file.type);
  if (!extension) redirect(`/profile/verification?error=${encodeURIComponent("Upload a JPG, PNG, WebP or PDF document.")}`);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const path = `${userId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) redirect(`/profile/verification?error=${encodeURIComponent(uploadError.message)}`);

  const { error: insertError } = await supabase.from("kyc_documents").insert({
    user_id: userId,
    document_type: documentType,
    storage_path: path,
    file_name: file.name.slice(0,180),
    mime_type: file.type,
    size_bytes: file.size,
  });
  if (insertError) {
    await supabase.storage.from("kyc-documents").remove([path]);
    redirect(`/profile/verification?error=${encodeURIComponent(insertError.message)}`);
  }
  redirect(`/profile/verification?message=${encodeURIComponent("Identity document uploaded securely.")}`);
}

export async function deleteKycDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: document } = await supabase.from("kyc_documents").select("id,storage_path,status").eq("id", id).maybeSingle();
  if (!document || document.status !== "uploaded") redirect(`/profile/verification?error=${encodeURIComponent("This document can no longer be removed.")}`);
  const { error: storageError } = await supabase.storage.from("kyc-documents").remove([document.storage_path]);
  if (storageError) redirect(`/profile/verification?error=${encodeURIComponent(storageError.message)}`);
  const { error } = await supabase.from("kyc_documents").delete().eq("id", id);
  if (error) redirect(`/profile/verification?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/verification?message=${encodeURIComponent("Document removed.")}`);
}

export async function requestKycReview() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("request_kyc_review", { p_level: "basic" });
  if (error) redirect(`/profile/verification?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/verification?message=${encodeURIComponent("Verification request submitted. You will be notified when review is complete.")}`);
}

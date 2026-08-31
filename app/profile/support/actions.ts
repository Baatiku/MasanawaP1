'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function createSupportCase(formData: FormData) {
  const category = String(formData.get("category") ?? "other").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data, error } = await supabase.rpc("create_support_case", { p_category: category, p_subject: subject, p_message: message });
  if (error) redirect(`/profile/support?error=${encodeURIComponent(error.message)}`);
  const id = String(data ?? "");
  redirect(id ? `/profile/support/${id}?message=${encodeURIComponent("Support case created.")}` : `/profile/support?message=${encodeURIComponent("Support case created.")}`);
}

export async function replySupportCase(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !message) redirect("/profile/support");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("reply_support_case", { p_case_id: id, p_message: message });
  if (error) redirect(`/profile/support/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/support/${id}?message=${encodeURIComponent("Reply sent.")}`);
}

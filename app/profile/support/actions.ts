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
  const { data, error } = await supabase.rpc("create_support_case", {
    p_category: category,
    p_subject: subject,
    p_message: message,
  });
  if (error) redirect(`/profile/support?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/support?message=${encodeURIComponent(`Support case ${String(data).slice(0,8)} created.`)}`);
}

'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function adminReplySupportCase(formData: FormData) {
  const id = String(formData.get("case_id") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const status = String(formData.get("status") ?? "waiting_user").trim();
  const priority = String(formData.get("priority") ?? "normal").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !message) redirect("/admin/support?error=Invalid+support+reply");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("admin_reply_support_case", {
    p_case_id: id,
    p_message: message,
    p_status: status,
    p_priority: priority,
  });
  if (error) redirect(`/admin/support/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/support/${id}?message=${encodeURIComponent("Support reply sent.")}`);
}

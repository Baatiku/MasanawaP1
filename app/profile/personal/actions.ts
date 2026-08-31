'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function updatePersonalProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (fullName.length < 2) redirect(`/profile/personal?error=${encodeURIComponent("Enter your full name.")}`);
  if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) redirect(`/profile/personal?error=${encodeURIComponent("Enter a valid phone number.")}`);
  if (username && !/^[a-z0-9_]{3,24}$/.test(username)) redirect(`/profile/personal?error=${encodeURIComponent("Username must be 3–24 letters, numbers or underscores.")}`);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { error } = await supabase.from("profiles").update({
    full_name: fullName,
    phone: phone || null,
    username: username || null,
  }).eq("id", userId);

  if (error) redirect(`/profile/personal?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/personal?message=${encodeURIComponent("Profile updated successfully.")}`);
}

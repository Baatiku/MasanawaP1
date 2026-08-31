'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (!email || !password) redirect("/login?error=Email%20and%20password%20are%20required");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function register(formData: FormData) {
  const fullName = value(formData, "full_name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (fullName.length < 2) redirect("/register?error=Enter%20your%20full%20name");
  if (!email || password.length < 8) redirect("/register?error=Use%20a%20valid%20email%20and%20at%20least%208%20characters%20for%20your%20password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

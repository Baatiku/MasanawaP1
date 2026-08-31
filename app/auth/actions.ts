'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function appUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
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
  const referralCode = value(formData, "referral_code").toUpperCase();
  if (fullName.length < 2) redirect("/register?error=Enter%20your%20full%20name");
  if (!email || password.length < 8) redirect("/register?error=Use%20a%20valid%20email%20and%20at%20least%208%20characters%20for%20your%20password");
  if (referralCode && !/^[A-Z0-9]{6,24}$/.test(referralCode)) redirect(`/register?error=${encodeURIComponent("Referral code format is invalid.")}`);
  const supabase = await createClient();
  if (referralCode) {
    const { data: referral } = await supabase.from("referral_codes").select("code").eq("code", referralCode).maybeSingle();
    // RLS intentionally prevents anonymous code enumeration. The database trigger validates attribution again after signup.
    void referral;
  }
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, ...(referralCode ? { referral_code: referralCode } : {}) } },
  });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account");
}

export async function requestPasswordReset(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!email) redirect(`/forgot-password?error=${encodeURIComponent("Enter your email address.")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/auth/recovery`,
  });
  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  redirect(`/forgot-password?message=${encodeURIComponent("If an account exists for that email, a password reset link has been sent.")}`);
}

export async function completePasswordReset(formData: FormData) {
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirm_password");
  if (password.length < 8) redirect(`/reset-password?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  if (password !== confirmPassword) redirect(`/reset-password?error=${encodeURIComponent("The password entries do not match.")}`);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/forgot-password?error=${encodeURIComponent("Your recovery session expired. Request a new reset link.")}`);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  await supabase.auth.signOut({ scope: "global" });
  redirect(`/login?message=${encodeURIComponent("Password updated. Sign in with your new password.")}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

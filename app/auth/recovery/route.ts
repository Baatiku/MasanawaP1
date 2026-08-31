import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const base = `${url.protocol}//${url.host}`;
  if (!code) return NextResponse.redirect(`${base}/forgot-password?error=${encodeURIComponent("Invalid recovery link.")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${base}/forgot-password?error=${encodeURIComponent("This recovery link is invalid or expired. Request a new one.")}`);
  return NextResponse.redirect(`${base}/reset-password`);
}

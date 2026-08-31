import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const body = await request.json() as { type?: string; amountMinor?: number; asset?: string };
    if (!body.type || !["crypto_buy", "crypto_sell", "crypto_swap"].includes(body.type)) return NextResponse.json({ error: "Unsupported crypto action" }, { status: 400 });
    if (typeof body.amountMinor !== "number" || !Number.isFinite(body.amountMinor) || body.amountMinor <= 0) return NextResponse.json({ error: "Valid amountMinor is required" }, { status: 400 });
    if (!body.asset || !["USDT", "BTC", "ETH"].includes(body.asset)) return NextResponse.json({ error: "Unsupported asset" }, { status: 400 });

    const { data: available } = await supabase.rpc("crypto_trading_available");
    if (!available) return NextResponse.json({ error: "Crypto quotes are unavailable until a verified liquidity provider and quote adapter are enabled." }, { status: 503 });

    // Deliberately do not synthesize a rate or fee here. The next provider adapter must
    // return a signed/expiring quote before this endpoint can return executable pricing.
    return NextResponse.json({ error: "Executable provider quote adapter is not configured." }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

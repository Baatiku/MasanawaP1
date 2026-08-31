import { NextResponse } from "next/server";
import { createQuote, type TransactionType } from "../../../../lib/domain";

const allowed = new Set<TransactionType>(["crypto_buy", "crypto_sell", "crypto_swap"]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as { type?: TransactionType; amountMinor?: number; asset?: string };
    if (!body.type || !allowed.has(body.type)) return NextResponse.json({ error: "Unsupported crypto action" }, { status: 400 });
    if (typeof body.amountMinor !== "number") return NextResponse.json({ error: "amountMinor is required" }, { status: 400 });
    if (!body.asset || !["USDT", "BTC", "ETH"].includes(body.asset)) return NextResponse.json({ error: "Unsupported asset" }, { status: 400 });

    const feeMinor = Math.max(10000, Math.round(body.amountMinor * 0.005));
    const quote = createQuote(body.type, body.amountMinor, feeMinor);
    return NextResponse.json({ quote: { ...quote, asset: body.asset, rateSource: "provider-pending" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}

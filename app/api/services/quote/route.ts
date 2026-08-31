import { NextResponse } from "next/server";
import { createQuote, type TransactionType } from "../../../../lib/domain";

const allowed = new Set<TransactionType>(["airtime", "data", "electricity", "cable"]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as { type?: TransactionType; amountMinor?: number };
    if (!body.type || !allowed.has(body.type)) {
      return NextResponse.json({ error: "Unsupported service type" }, { status: 400 });
    }
    if (typeof body.amountMinor !== "number") {
      return NextResponse.json({ error: "amountMinor is required" }, { status: 400 });
    }
    const quote = createQuote(body.type, body.amountMinor, 0);
    return NextResponse.json({ quote });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}

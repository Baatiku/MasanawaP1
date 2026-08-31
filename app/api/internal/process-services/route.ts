import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { processServiceTransaction } from "../../../../lib/providers/service-orchestrator";

function authorized(request: Request) {
  const expected = process.env.MASANAWA_WORKER_SECRET;
  if (!expected) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });

  let transactionId: string | undefined;
  try {
    const body = await request.json() as { transaction_id?: string };
    transactionId = body.transaction_id;
  } catch {
    transactionId = undefined;
  }

  if (transactionId) {
    try {
      const result = await processServiceTransaction(transactionId);
      return NextResponse.json({ ok: true, transaction_id: transactionId, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Worker failed";
      return NextResponse.json({ ok: false, transaction_id: transactionId, error: message }, { status: 500 });
    }
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin.from("transactions")
    .select("id")
    .in("kind", ["airtime", "data", "electricity", "cable", "gift_card", "telegram"])
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(10);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const results: Array<{ transaction_id: string; result?: unknown; error?: string }> = [];
  for (const row of rows ?? []) {
    try {
      results.push({ transaction_id: row.id, result: await processServiceTransaction(row.id) });
    } catch (workerError) {
      results.push({ transaction_id: row.id, error: workerError instanceof Error ? workerError.message : "Worker failed" });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}

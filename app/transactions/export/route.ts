import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

const allowedStatuses = new Set(["pending","processing","successful","failed","reversed","cancelled"]);
const allowedKinds = new Set(["deposit","withdrawal","transfer","airtime","data","electricity","cable","gift_card","telegram","crypto_buy","crypto_sell","crypto_swap","refund","adjustment"]);

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";
  const kind = url.searchParams.get("kind") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim().slice(0,80);

  let query = supabase.from("transactions")
    .select("reference,kind,status,amount_minor,fee_minor,currency,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (allowedStatuses.has(status)) query = query.eq("status", status);
  if (allowedKinds.has(kind)) query = query.eq("kind", kind);
  if (q) query = query.ilike("reference", `%${q.replaceAll('%','\\%').replaceAll('_','\\_')}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Unable to export transactions" }, { status: 500 });

  const lines = [
    ["Reference","Type","Status","Amount","Fee","Currency","Date"].map(csvCell).join(","),
    ...(data ?? []).map(row => [
      row.reference,
      row.kind,
      row.status,
      (Number(row.amount_minor) / 100).toFixed(2),
      (Number(row.fee_minor) / 100).toFixed(2),
      row.currency,
      row.created_at,
    ].map(csvCell).join(",")),
  ];
  const date = new Date().toISOString().slice(0,10);
  return new NextResponse(`\uFEFF${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="masanawa-transactions-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

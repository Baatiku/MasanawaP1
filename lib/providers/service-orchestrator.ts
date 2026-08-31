import "server-only";
import { createAdminClient } from "../supabase/admin";
import { purchaseWithVtpass, requeryVtpass, type ProviderPurchaseResult } from "./vtpass";

type Route = {
  route_id: string;
  provider_id: string;
  provider_code: string;
  provider_name: string;
  provider_service_id: string;
  provider_product_code: string | null;
  provider_cost_minor: number | null;
  route_priority: number;
  provider_priority: number;
};

type PendingAttempt = {
  id: string;
  provider_id: string | null;
  status: string;
  request_payload: Record<string, unknown> | null;
};

function lagosRequestId(reference: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? "00";
  const prefix = `${pick("year")}${pick("month")}${pick("day")}${pick("hour")}${pick("minute")}`;
  const suffix = reference.replace(/[^a-zA-Z0-9]/g, "").slice(-20) || crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  return `${prefix}${suffix}`;
}

async function recordAttempt(transactionId: string, route: Route, attemptNo: number, status: string, requestPayload: unknown, responsePayload: unknown, result?: ProviderPurchaseResult) {
  const admin = createAdminClient();
  await admin.from("provider_attempts").insert({
    transaction_id: transactionId,
    provider_id: route.provider_id,
    attempt_no: attemptNo,
    status,
    provider_reference: result?.providerReference ?? null,
    error_code: result?.state === "failed" ? result.code : null,
    error_message: result?.state === "failed" ? result.message : null,
    request_payload: requestPayload ?? {},
    response_payload: responsePayload ?? {},
  });
}

async function updateAttempt(attemptId: string, status: string, result: ProviderPurchaseResult) {
  const admin = createAdminClient();
  await admin.from("provider_attempts").update({
    status,
    provider_reference: result.providerReference,
    error_code: result.state === "failed" ? result.code : null,
    error_message: result.state === "failed" ? result.message : null,
    response_payload: result.raw ?? {},
    updated_at: new Date().toISOString(),
  }).eq("id", attemptId);
}

async function finishSuccess(transactionId: string, providerId: string, providerReference: string | null, providerCode: string) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("settle_service_transaction", {
    p_transaction_id: transactionId,
    p_provider_reference: providerReference || `${providerCode}:${transactionId}`,
  });
  if (error) throw new Error(`Settlement failed: ${error.message}`);
  await admin.rpc("record_provider_result", { p_provider_id: providerId, p_success: true, p_failure_threshold: 3, p_cooldown_seconds: 300 });
  await admin.from("service_orders").update({ provider: providerCode, provider_reference: providerReference }).eq("transaction_id", transactionId);
}

async function handleResult(transactionId: string, route: Route, result: ProviderPurchaseResult, attemptId?: string) {
  const admin = createAdminClient();
  if (attemptId) await updateAttempt(attemptId, result.state, result);
  if (result.state === "successful") {
    await finishSuccess(transactionId, route.provider_id, result.providerReference, route.provider_code);
    return "successful" as const;
  }
  if (result.state === "pending") {
    await admin.rpc("release_service_transaction", { p_transaction_id: transactionId, p_status: "pending" });
    return "pending" as const;
  }
  await admin.rpc("record_provider_result", { p_provider_id: route.provider_id, p_success: false, p_failure_threshold: 3, p_cooldown_seconds: 300 });
  return "failed" as const;
}

export async function processServiceTransaction(transactionId: string) {
  const admin = createAdminClient();
  const { data: claimed, error: claimError } = await admin.rpc("claim_service_transaction", { p_transaction_id: transactionId, p_stale_after_seconds: 300 });
  if (claimError) throw new Error(claimError.message);
  if (!claimed) return { state: "not_claimed" as const };

  try {
    const [{ data: tx, error: txError }, { data: order, error: orderError }] = await Promise.all([
      admin.from("transactions").select("id,user_id,kind,status,amount_minor,currency,reference").eq("id", transactionId).single(),
      admin.from("service_orders").select("transaction_id,service_type,recipient,product_code").eq("transaction_id", transactionId).single(),
    ]);
    if (txError || !tx) throw new Error(txError?.message || "Transaction not found");
    if (orderError || !order) throw new Error(orderError?.message || "Service order not found");
    if (!order.product_code) throw new Error("Service product code missing");

    const { data: profile } = await admin.from("profiles").select("phone").eq("id", tx.user_id).maybeSingle();
    const { data: routes, error: routeError } = await admin.rpc("next_routes_for_product", { p_product_code: order.product_code });
    if (routeError) throw new Error(routeError.message);
    const typedRoutes = (routes ?? []) as Route[];
    if (typedRoutes.length === 0) {
      await admin.rpc("release_service_transaction", { p_transaction_id: transactionId, p_status: "pending" });
      return { state: "no_route" as const };
    }

    const { data: pendingRaw } = await admin.from("provider_attempts")
      .select("id,provider_id,status,request_payload")
      .eq("transaction_id", transactionId)
      .in("status", ["pending", "processing"])
      .order("attempt_no", { ascending: false })
      .limit(1)
      .maybeSingle();
    const pendingAttempt = pendingRaw as PendingAttempt | null;

    if (pendingAttempt?.provider_id) {
      const route = typedRoutes.find(item => item.provider_id === pendingAttempt.provider_id);
      const priorRequestId = typeof pendingAttempt.request_payload?.request_id === "string" ? pendingAttempt.request_payload.request_id : null;
      if (route?.provider_code === "vtpass" && priorRequestId) {
        const result = await requeryVtpass(priorRequestId);
        const state = await handleResult(transactionId, route, result, pendingAttempt.id);
        if (state !== "failed") return { state, provider: route.provider_code };
      } else {
        await admin.rpc("release_service_transaction", { p_transaction_id: transactionId, p_status: "pending" });
        return { state: "pending" as const };
      }
    }

    const { count } = await admin.from("provider_attempts").select("id", { count: "exact", head: true }).eq("transaction_id", transactionId);
    let attemptNo = (count ?? 0) + 1;

    for (const route of typedRoutes) {
      if (route.provider_code !== "vtpass") continue;
      const requestId = lagosRequestId(tx.reference);
      const requestPayload = {
        request_id: requestId,
        service_id: route.provider_service_id,
        variation_code: route.provider_product_code,
        recipient: order.recipient,
        amount_minor: Number(tx.amount_minor),
      };
      const result = await purchaseWithVtpass({
        requestId,
        serviceId: route.provider_service_id,
        serviceType: order.service_type,
        recipient: order.recipient,
        customerPhone: profile?.phone ?? null,
        amountMinor: Number(tx.amount_minor),
        variationCode: route.provider_product_code,
      });
      await recordAttempt(transactionId, route, attemptNo++, result.state, requestPayload, result.raw, result);
      const state = await handleResult(transactionId, route, result);
      if (state === "successful" || state === "pending") return { state, provider: route.provider_code };
    }

    await admin.rpc("release_service_transaction", { p_transaction_id: transactionId, p_status: "failed" });
    return { state: "failed" as const };
  } catch (error) {
    await admin.rpc("release_service_transaction", { p_transaction_id: transactionId, p_status: "pending" });
    throw error;
  }
}

import "server-only";

export type VtpassPurchaseInput = {
  requestId: string;
  serviceId: string;
  serviceType: string;
  recipient: string;
  customerPhone?: string | null;
  amountMinor: number;
  variationCode?: string | null;
};

export type ProviderPurchaseResult = {
  state: "successful" | "pending" | "failed";
  providerReference: string | null;
  code: string | null;
  message: string;
  raw: unknown;
};

export type VtpassVariation = {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice?: string;
};

export type VtpassVariationCatalog = {
  serviceName: string;
  serviceId: string;
  variations: VtpassVariation[];
};

type VtpassResponse = {
  code?: string;
  response_description?: string;
  requestId?: string;
  request_id?: string;
  content?: { transactions?: { status?: string; transactionId?: string | number } };
};

function environmentBaseUrl() {
  return process.env.VTPASS_ENVIRONMENT === "live" ? "https://vtpass.com" : "https://sandbox.vtpass.com";
}

function config() {
  const apiKey = process.env.VTPASS_API_KEY;
  const secretKey = process.env.VTPASS_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error("VTpass credentials are not configured");
  return { apiKey, secretKey, baseUrl: environmentBaseUrl() };
}

export function isVtpassCatalogConfigured() {
  return Boolean(process.env.VTPASS_API_KEY && process.env.VTPASS_PUBLIC_KEY);
}

export async function fetchVtpassVariations(serviceId: string): Promise<VtpassVariationCatalog> {
  const apiKey = process.env.VTPASS_API_KEY;
  const publicKey = process.env.VTPASS_PUBLIC_KEY;
  if (!apiKey || !publicKey) throw new Error("VTpass catalog credentials are not configured");
  if (!/^[a-z0-9-]{2,80}$/i.test(serviceId)) throw new Error("Invalid VTpass service ID");

  const response = await fetch(`${environmentBaseUrl()}/api/service-variations?serviceID=${encodeURIComponent(serviceId)}`, {
    headers: { "api-key": apiKey, "public-key": publicKey },
    cache: "no-store",
  });
  const payload = await response.json() as {
    response_description?: string;
    content?: { ServiceName?: string; serviceID?: string; variations?: VtpassVariation[] };
  };
  if (!response.ok || !payload.content) throw new Error(payload.response_description || `VTpass catalog request failed (${response.status})`);
  return {
    serviceName: payload.content.ServiceName || serviceId,
    serviceId: payload.content.serviceID || serviceId,
    variations: Array.isArray(payload.content.variations) ? payload.content.variations : [],
  };
}

function classify(body: VtpassResponse): ProviderPurchaseResult {
  const code = body.code ? String(body.code) : null;
  const status = String(body.content?.transactions?.status ?? "").toLowerCase();
  const providerReference = body.content?.transactions?.transactionId != null
    ? String(body.content.transactions.transactionId)
    : (body.requestId ?? body.request_id ?? null);
  const message = body.response_description || (status ? `VTpass status: ${status}` : "VTpass response received");

  if (code === "000" && ["delivered", "successful", "success"].includes(status)) {
    return { state: "successful", providerReference, code, message, raw: body };
  }
  if (code === "099" || ["pending", "initiated", "processing"].includes(status) || !code) {
    return { state: "pending", providerReference, code, message, raw: body };
  }
  if (["failed", "reversed"].includes(status)) {
    return { state: "failed", providerReference, code, message, raw: body };
  }
  return { state: "pending", providerReference, code, message, raw: body };
}

function purchasePayload(input: VtpassPurchaseInput) {
  const amount = input.amountMinor / 100;
  const phone = input.customerPhone || input.recipient;
  if (input.serviceType === "airtime") {
    return { request_id: input.requestId, serviceID: input.serviceId, amount, phone: input.recipient };
  }
  return {
    request_id: input.requestId,
    serviceID: input.serviceId,
    billersCode: input.recipient,
    variation_code: input.variationCode || undefined,
    amount,
    phone,
  };
}

export async function purchaseWithVtpass(input: VtpassPurchaseInput): Promise<ProviderPurchaseResult> {
  const { apiKey, secretKey, baseUrl } = config();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${baseUrl}/api/pay`, {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": apiKey, "secret-key": secretKey },
      body: JSON.stringify(purchasePayload(input)),
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    let body: VtpassResponse;
    try { body = JSON.parse(text) as VtpassResponse; }
    catch { return { state: "pending", providerReference: input.requestId, code: null, message: `Unparseable VTpass response (${response.status})`, raw: text }; }
    return classify(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "VTpass request failed";
    return { state: "pending", providerReference: input.requestId, code: null, message, raw: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function requeryVtpass(requestId: string): Promise<ProviderPurchaseResult> {
  const { apiKey, secretKey, baseUrl } = config();
  const response = await fetch(`${baseUrl}/api/requery`, {
    method: "POST",
    headers: { "content-type": "application/json", "api-key": apiKey, "secret-key": secretKey },
    body: JSON.stringify({ request_id: requestId }),
    cache: "no-store",
  });
  const text = await response.text();
  try { return classify(JSON.parse(text) as VtpassResponse); }
  catch { return { state: "pending", providerReference: requestId, code: null, message: `Unparseable VTpass requery (${response.status})`, raw: text }; }
}

'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

function productCode(serviceId: string, variationCode: string) {
  return `VTPASS_${serviceId}_${variationCode}`.toUpperCase().replace(/[^A-Z0-9_]+/g, "_").slice(0, 120);
}

export async function importVtpassVariation(formData: FormData) {
  const serviceType = String(formData.get("service_type") ?? "").trim();
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const variationCode = String(formData.get("variation_code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const network = String(formData.get("network") ?? "").trim();
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  if (!serviceType || !serviceId || !variationCode || !name || !Number.isFinite(amountNgn) || amountNgn <= 0) {
    redirect(`/admin/vtpass?error=${encodeURIComponent("Invalid VTpass variation import.")}`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/");

  const code = productCode(serviceId, variationCode);
  const amountMinor = Math.round(amountNgn * 100);
  const { error: createError } = await supabase.rpc("admin_create_service_product", {
    p_service_type: serviceType,
    p_product_code: code,
    p_display_name: name,
    p_network: network || null,
    p_pricing_mode: "fixed",
    p_amount_minor: amountMinor,
    p_min_amount_minor: null,
    p_max_amount_minor: null,
  });
  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    redirect(`/admin/vtpass?error=${encodeURIComponent(createError.message)}`);
  }

  const { error: routeError } = await supabase.rpc("admin_upsert_provider_product_route", {
    p_product_code: code,
    p_provider_code: "vtpass",
    p_provider_service_id: serviceId,
    p_provider_product_code: variationCode,
    p_provider_cost_minor: amountMinor,
    p_priority: 10,
    p_active: false,
  });
  if (routeError) redirect(`/admin/vtpass?error=${encodeURIComponent(routeError.message)}`);
  redirect(`/admin?message=${encodeURIComponent(`${name} imported inactive with an inactive VTpass route. Review pricing before activation.`)}`);
}

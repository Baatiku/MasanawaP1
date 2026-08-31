'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/");
  return supabase;
}

export async function updateProvider(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const active = formData.get("active") === "on";
  const priority = Number(formData.get("priority") ?? 10);
  if (!code || !Number.isInteger(priority) || priority < 1 || priority > 1000) {
    redirect(`/admin?error=${encodeURIComponent("Invalid provider settings.")}`);
  }
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_update_provider", { p_code: code, p_active: active, p_priority: priority });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect(`/admin?message=${encodeURIComponent(`${code} updated.`)}`);
}

export async function updateProduct(formData: FormData) {
  const productCode = String(formData.get("product_code") ?? "").trim();
  const active = formData.get("active") === "on";
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  const providerCode = String(formData.get("provider_code") ?? "").trim();
  const providerProductCode = String(formData.get("provider_product_code") ?? "").trim();
  if (!productCode || !Number.isFinite(amountNgn) || amountNgn <= 0) {
    redirect(`/admin?error=${encodeURIComponent("Invalid service product settings.")}`);
  }
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_update_service_product", {
    p_product_code: productCode,
    p_active: active,
    p_amount_minor: Math.round(amountNgn * 100),
    p_provider_code: providerCode || null,
    p_provider_product_code: providerProductCode || null,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect(`/admin?message=${encodeURIComponent(`${productCode} updated.`)}`);
}

export async function upsertProviderRoute(formData: FormData) {
  const productCode = String(formData.get("product_code") ?? "").trim();
  const providerCode = String(formData.get("provider_code") ?? "").trim();
  const providerServiceId = String(formData.get("provider_service_id") ?? "").trim();
  const providerProductCode = String(formData.get("provider_product_code") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 10);
  const active = formData.get("active") === "on";
  const costRaw = String(formData.get("provider_cost") ?? "").trim();
  const costNgn = costRaw === "" ? null : Number(costRaw.replace(/,/g, ""));

  if (!productCode || !providerCode || !providerServiceId || !Number.isInteger(priority) || priority < 1 || priority > 1000 || (costNgn !== null && (!Number.isFinite(costNgn) || costNgn < 0))) {
    redirect(`/admin?error=${encodeURIComponent("Invalid provider route settings.")}`);
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_upsert_provider_product_route", {
    p_product_code: productCode,
    p_provider_code: providerCode,
    p_provider_service_id: providerServiceId,
    p_provider_product_code: providerProductCode || null,
    p_provider_cost_minor: costNgn === null ? null : Math.round(costNgn * 100),
    p_priority: priority,
    p_active: active,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect(`/admin?message=${encodeURIComponent(`${providerCode} route for ${productCode} updated.`)}`);
}

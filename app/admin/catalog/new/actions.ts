'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export async function createCatalogProduct(formData: FormData) {
  const serviceType = String(formData.get("service_type") ?? "").trim();
  const productCode = String(formData.get("product_code") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const network = String(formData.get("network") ?? "").trim();
  const pricingMode = String(formData.get("pricing_mode") ?? "fixed").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const minRaw = String(formData.get("min_amount") ?? "").trim();
  const maxRaw = String(formData.get("max_amount") ?? "").trim();
  const toMinor = (value: string) => value === "" ? null : Math.round(Number(value.replace(/,/g, "")) * 100);
  const amount = toMinor(amountRaw);
  const minimum = toMinor(minRaw);
  const maximum = toMinor(maxRaw);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/");

  if (!serviceType || !productCode || !displayName || !["fixed","flexible"].includes(pricingMode)) {
    redirect(`/admin/catalog/new?error=${encodeURIComponent("Complete all required product fields.")}`);
  }

  const { error } = await supabase.rpc("admin_create_service_product", {
    p_service_type: serviceType,
    p_product_code: productCode,
    p_display_name: displayName,
    p_network: network || null,
    p_pricing_mode: pricingMode,
    p_amount_minor: amount,
    p_min_amount_minor: minimum,
    p_max_amount_minor: maximum,
  });
  if (error) redirect(`/admin/catalog/new?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin?message=${encodeURIComponent(`${displayName} created inactive. Add a verified provider route before activation.`)}`);
}

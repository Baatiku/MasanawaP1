import { redirect } from "next/navigation";
import WelcomeContent from "./components/WelcomeContent";
import { createClient } from "../lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (claimsData?.claims?.sub) redirect("/dashboard");
  return <WelcomeContent/>;
}

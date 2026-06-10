import { redirect } from "next/navigation";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";

// Redirect legacy del sito PynkStudio originale.
export default async function CheckupOperativoRoute() {
  await requirePynkstudioTenant();
  redirect("/consulenza");
}

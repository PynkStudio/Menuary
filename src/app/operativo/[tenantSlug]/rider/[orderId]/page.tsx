import { notFound, redirect } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getRiderSession } from "@/lib/rider-session";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { RiderOrderDetail } from "@/components/modules/rider/rider-order-detail";

export default async function RiderOrderPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; orderId: string }>;
}) {
  const { tenantSlug, orderId } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant?.features.rider) notFound();

  const session = await getRiderSession();
  if (!session || session.tenantId !== tenantSlug) {
    redirect(`/operativo/${tenantSlug}/rider`);
  }

  const svc = createSupabaseServiceClient();
  if (!svc) notFound();

  const { data: order } = await svc
    .from("orders")
    .select(`
      id, code, status, total, notes,
      customer_name, customer_phone, delivery_address, delivery_address_text,
      delivery_pin_lat, delivery_pin_lng,
      payment_status, payment_provider,
      order_lines(name, qty, variant_label)
    `)
    .eq("id", orderId)
    .eq("tenant_id", tenantSlug)
    .eq("rider_id", session.riderId)
    .maybeSingle();

  if (!order) notFound();

  return <RiderOrderDetail order={order as Parameters<typeof RiderOrderDetail>[0]["order"]} />;
}

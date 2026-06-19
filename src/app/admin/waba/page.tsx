import { requirePermission } from "@/lib/auth/admin";
import { ComingSoon } from "@/components/admin/coming-soon";

export const dynamic = "force-dynamic";

export default async function WabaPage() {
  await requirePermission("waba");
  return <ComingSoon title="WhatsApp / WABA" note="Dashboard, peranti, inbox, template, blaster, kontak (M2)." />;
}

import { ContractEditor } from "@/components/admin/platform/contract-editor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ContrattoDettaglioPage({ params }: Props) {
  const { id } = await params;
  return <ContractEditor contractId={id} />;
}

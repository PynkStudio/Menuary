import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { MenuaryContractPdf } from "@/lib/contracts/menuary-contract-pdf";
import type { ContractData } from "@/lib/contracts/menuary-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  data: ContractData;
  overrides?: Record<string, string>;
  fileName?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.data?.numero || !body.data.cliente) {
    return NextResponse.json(
      { error: "Missing required contract fields" },
      { status: 400 },
    );
  }

  const overrides = body.overrides ?? {};
  try {
    const buffer = await renderToBuffer(
      <MenuaryContractPdf data={body.data} overrides={overrides} />,
    );

    const fileName =
      body.fileName ??
      `Contratto-${body.data.numero}-${slug(body.data.cliente.ragioneSociale)}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[contracts/pdf] render failed", {
      contractNumber: body.data.numero,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "PDF render failed" }, { status: 500 });
  }
}

function slug(s: string): string {
  return (s || "cliente")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

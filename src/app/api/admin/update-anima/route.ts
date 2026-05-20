import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  gh,
  extractAnimaFiles,
  commitAnimaToGitHub,
  branchExists,
} from "@/lib/github-anima";

async function requireDemoPermission() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return false;
  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return (
    isSiteadminRole(siteadmin?.role) &&
    hasAdminPermission(siteadmin.role, "crm:demo")
  );
}

export async function POST(req: NextRequest) {
  if (!(await requireDemoPermission())) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const fd = await req.formData();
  const tenantSlug = fd.get("tenantSlug") as string | null;
  const animaFile = fd.get("animaFile") as File | null;

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug mancante." }, { status: 400 });
  }
  if (!animaFile || animaFile.size === 0) {
    return NextResponse.json({ error: "Nessun file caricato." }, { status: 400 });
  }

  try {
    const buffer = new Uint8Array(await animaFile.arrayBuffer());
    const files = extractAnimaFiles(animaFile, buffer);

    // Prova prima il branch demo esistente, altrimenti crea un branch di aggiornamento
    const demoBranch = `demo/${tenantSlug}`;
    const targetBranch = (await branchExists(demoBranch))
      ? demoBranch
      : `update-figma/${tenantSlug}`;

    let prUrl: string | null = null;

    if (targetBranch !== demoBranch) {
      // Branch demo già mergiato → crea nuovo branch da main e apre PR
      const mainRef = await gh<{ object: { sha: string } }>("/git/ref/heads/main");
      await gh("/git/refs", "POST", {
        ref: `refs/heads/${targetBranch}`,
        sha: mainRef.object.sha,
      });
    }

    await commitAnimaToGitHub(targetBranch, tenantSlug, files);

    if (targetBranch !== demoBranch) {
      const pr = await gh<{ html_url: string }>("/pulls", "POST", {
        title: `Update figma design: ${tenantSlug}`,
        head: targetBranch,
        base: "main",
        body: [
          `## Aggiornamento design Figma — \`${tenantSlug}\``,
          "",
          `- **File**: \`${animaFile.name}\` (${files.length} file in \`public/${tenantSlug}/anima/\`)`,
          `- [ ] Verificare che le sezioni con \`<AnimaSlot />\` siano ancora agganciare correttamente`,
        ].join("\n"),
      });
      prUrl = pr.html_url;
    }

    return NextResponse.json({
      success: true,
      branch: targetBranch,
      fileCount: files.length,
      pr_url: prUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

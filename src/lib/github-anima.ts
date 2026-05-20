import { unzipSync } from "fflate";

export type AnimaFile = { path: string; content: Uint8Array };

const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER ?? "PynkStudio";
const GITHUB_REPO = process.env.GITHUB_REPO_NAME ?? "Menuary";

export async function gh<T = unknown>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as T;
}

export function extractAnimaFiles(file: File, buffer: Uint8Array): AnimaFile[] {
  if (!file.name.endsWith(".zip")) {
    return [{ path: "index.html", content: buffer }];
  }

  const unzipped = unzipSync(buffer);
  const allPaths = Object.keys(unzipped).filter((p) => !p.endsWith("/"));

  // Rimuovi il prefisso comune se Anima wrappa tutto in una cartella root
  const topDirs = new Set(allPaths.map((p) => p.split("/")[0]));
  const hasCommonRoot =
    topDirs.size === 1 && allPaths.every((p) => p.includes("/"));
  const prefix = hasCommonRoot ? `${[...topDirs][0]}/` : "";

  return allPaths.map((p) => ({
    path: prefix ? p.slice(prefix.length) : p,
    content: unzipped[p],
  }));
}

export async function commitAnimaToGitHub(
  branch: string,
  tenantSlug: string,
  files: AnimaFile[],
): Promise<void> {
  const branchData = await gh<{
    commit: { sha: string; commit: { tree: { sha: string } } };
  }>(`/branches/${branch}`);

  const treeItems = await Promise.all(
    files.map(async ({ path, content }) => {
      const blob = await gh<{ sha: string }>("/git/blobs", "POST", {
        content: Buffer.from(content).toString("base64"),
        encoding: "base64",
      });
      return {
        path: `public/${tenantSlug}/anima/${path}`,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    }),
  );

  const newTree = await gh<{ sha: string }>("/git/trees", "POST", {
    base_tree: branchData.commit.commit.tree.sha,
    tree: treeItems,
  });

  const newCommit = await gh<{ sha: string }>("/git/commits", "POST", {
    message: `feat(tenant/${tenantSlug}): update figma/anima design import (${files.length} files)`,
    tree: newTree.sha,
    parents: [branchData.commit.sha],
  });

  await gh(`/git/refs/heads/${branch}`, "PATCH", { sha: newCommit.sha });
}

/** Verifica se un branch esiste. Ritorna true/false senza lanciare. */
export async function branchExists(branch: string): Promise<boolean> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  return res.ok;
}

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { generateMcpToken, hashMcpSecret, verifyPkce } from "./auth";

process.env.MCP_TOKEN_PEPPER = "test-pepper-with-at-least-thirty-two-characters";

test("genera token opachi con prefissi distinti", () => {
  const access = generateMcpToken("oauth_access");
  const refresh = generateMcpToken("oauth_refresh");
  assert.match(access.token, /^pynk_mcp_at_/);
  assert.match(refresh.token, /^pynk_mcp_rt_/);
  assert.notEqual(access.hash, hashMcpSecret(refresh.token));
});

test("verifica esclusivamente PKCE S256 corretto", () => {
  const verifier = "cowork-pkce-verifier-with-enough-entropy-123456789";
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  assert.equal(verifyPkce(verifier, challenge), true);
  assert.equal(verifyPkce(`${verifier}x`, challenge), false);
});

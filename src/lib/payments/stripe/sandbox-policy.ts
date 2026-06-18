const TENANTS_ALWAYS_ON_DEMO_SANDBOX = new Set(["cascina-errante", "kimos"]);

export function tenantUsesStripeDemoSandbox(tenantId: string | null | undefined) {
  return Boolean(tenantId && TENANTS_ALWAYS_ON_DEMO_SANDBOX.has(tenantId));
}

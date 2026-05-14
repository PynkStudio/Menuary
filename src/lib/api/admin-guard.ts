import { ADMIN_TOKEN_HEADER, getAdminPassword } from "@/lib/admin-auth";

export function isAdminRequest(req: Request): boolean {
  return req.headers.get(ADMIN_TOKEN_HEADER) === getAdminPassword();
}

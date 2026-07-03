import { SignJWT } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-do-not-use-in-production"
);

// 为 E2E 测试生成有/无 team 的 JWT token
export async function createTestToken(overrides?: {
  id?: string;
  name?: string;
  email?: string;
  team_id?: string;
}) {
  return new SignJWT({
    id: overrides?.id || "00000000-0000-0000-0000-000000000001",
    name: overrides?.name || "E2E Test User",
    email: overrides?.email || "e2e@vertax.test",
    team_id: overrides?.team_id || "00000000-0000-0000-0000-000000000001",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

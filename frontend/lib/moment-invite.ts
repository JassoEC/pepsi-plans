import "server-only";

import { createHmac } from "node:crypto";

export function createMomentInviteToken(roomId: string) {
  const secret = process.env.MOMENT_INVITE_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("MOMENT_INVITE_SECRET must contain at least 32 characters.");
  }

  return createHmac("sha256", secret)
    .update(roomId)
    .digest("base64url");
}

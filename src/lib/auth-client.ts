"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/** Browser auth client (same origin). Only call it when the server reports auth as configured. */
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

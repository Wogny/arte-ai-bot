import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from '../../drizzle/schema.js';
import { sdk } from "./sdk.js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    console.log(`[Auth] Authenticating request: ${opts.req.method} ${opts.req.url}`);
    user = await sdk.authenticateRequest(opts.req);
    if (user) {
      console.log(`[Auth] User authenticated: ${user.email} (ID: ${user.id})`);
    } else {
      console.log(`[Auth] No user found for request`);
    }
  } catch (error: any) {
    console.log(`[Auth] Authentication failed: ${error.message}`);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

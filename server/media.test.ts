import { describe, expect, it } from "vitest";
import { appRouter } from "./routers.js";
import type { TrpcContext } from "./_core/context.js";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-video",
    email: "video@example.com",
    name: "Video Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Media Router - Video Support", () => {
  it("should have media router available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify media router exists
    expect(caller.media).toBeDefined();
  });

  it("should have list procedure in media router", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify list procedure exists
    expect(caller.media.list).toBeDefined();
  });

  it("should have getById procedure in media router", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify getById procedure exists
    expect(caller.media.getById).toBeDefined();
  });

  it("should have create procedure in media router", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify create procedure exists
    expect(caller.media.create).toBeDefined();
  });

  it("should have delete procedure in media router", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify delete procedure exists
    expect(caller.media.delete).toBeDefined();
  });
});

describe("Scheduling Router - Video Support", () => {
  it("should have scheduling router available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify scheduling router exists
    expect(caller.scheduling).toBeDefined();
  });

  it("should have list procedure in scheduling router", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify list procedure exists
    expect(caller.scheduling.list).toBeDefined();
  });

  it("should have create procedure in scheduling router", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify create procedure exists
    expect(caller.scheduling.create).toBeDefined();
  });
});

describe("Multiplatform Router - Video Support", () => {
  it("should have multiplatform router available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify multiplatform router exists
    expect(caller.multiplatform).toBeDefined();
  });

  it("should have list procedure in multiplatform router", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify list procedure exists
    expect(caller.multiplatform.list).toBeDefined();
  });

  it("should have create procedure in multiplatform router", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify create procedure exists
    expect(caller.multiplatform.create).toBeDefined();
  });
});

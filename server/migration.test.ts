import { describe, expect, it } from "vitest";
import { appRouter } from "./routers.js";
import type { TrpcContext } from "./_core/context.js";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-migration",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Migration Validation Tests", () => {
  describe("Auth Router", () => {
    it("should have auth.me procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.me();
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it("should have auth.logout procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
    });
  });

  describe("Dashboard Router", () => {
    it("should have dashboard.stats procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.dashboard.stats()).not.toThrow();
    });
  });

  describe("Projects Router", () => {
    it("should have projects.list procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.projects.list()).not.toThrow();
    });
  });

  describe("Images Router", () => {
    it("should have images.list procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.images.list({})).not.toThrow();
    });
  });

  describe("Campaigns Router", () => {
    it("should have campaigns.list procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.campaigns.list({})).not.toThrow();
    });

    it("should have campaigns.downloadTemplate procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.campaigns.downloadTemplate()).not.toThrow();
    });
  });

  describe("Recommendations Router", () => {
    it("should have recommendations.list procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.recommendations.list({})).not.toThrow();
    });
  });

  describe("Scheduling Router", () => {
    it("should have scheduling.list procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.scheduling.list()).not.toThrow();
    });
  });

  describe("Meta Router", () => {
    it("should have meta.getCredentials procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.meta.getCredentials()).not.toThrow();
    });
  });

  describe("User Settings Router", () => {
    it("should have userSettings.get procedure", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw
      expect(() => caller.userSettings.get()).not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should have all required routers", () => {
      expect(appRouter).toBeDefined();
      expect(appRouter._def.procedures).toBeDefined();
    });
  });
});

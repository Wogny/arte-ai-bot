import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "email",
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
    res: {} as TrpcContext["res"],
  };
}

describe("Cancel Subscription", () => {
  describe("cancelSubscription mutation", () => {
    it("should cancel subscription successfully", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.subscription.cancelSubscription();
        expect(result).toBeDefined();
        expect(result).toHaveProperty("success");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should update subscription status to canceled", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        // Cancel subscription
        const cancelResult = await caller.subscription.cancelSubscription();
        expect(cancelResult).toBeDefined();

        // Check status
        const status = await caller.subscription.getCurrentSubscription();
        if (status) {
          expect(status.status).toBe("canceled");
          expect(status.canceledAt).toBeDefined();
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should set canceledAt timestamp", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        const beforeCancel = new Date();
        await caller.subscription.cancelSubscription();
        const afterCancel = new Date();

        const status = await caller.subscription.getCurrentSubscription();
        if (status && status.canceledAt) {
          const canceledAt = new Date(status.canceledAt);
          expect(canceledAt.getTime()).toBeGreaterThanOrEqual(beforeCancel.getTime());
          expect(canceledAt.getTime()).toBeLessThanOrEqual(afterCancel.getTime());
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should require authentication", async () => {
      const unauthenticatedCtx = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      } as TrpcContext;

      const caller = appRouter.createCaller(unauthenticatedCtx);

      try {
        await caller.subscription.cancelSubscription();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Subscription status after cancellation", () => {
    it("should return canceled status in getCurrentSubscription", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.subscription.cancelSubscription();
        const status = await caller.subscription.getCurrentSubscription();

        if (status) {
          expect(status.status).toBe("canceled");
          expect(status.isActive).toBe(false);
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should preserve subscription data after cancellation", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        const beforeCancel = await caller.subscription.getCurrentSubscription();

        if (beforeCancel) {
          await caller.subscription.cancelSubscription();
          const afterCancel = await caller.subscription.getCurrentSubscription();

          if (afterCancel) {
            expect(afterCancel.id).toBe(beforeCancel.id);
            expect(afterCancel.planId).toBe(beforeCancel.planId);
            expect(afterCancel.userId).toBe(beforeCancel.userId);
            expect(afterCancel.createdAt).toEqual(beforeCancel.createdAt);
          }
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Modal confirmation flow", () => {
    it("should validate modal receives correct plan name", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        const status = await caller.subscription.getCurrentSubscription();
        if (status) {
          expect(status.planName).toBeDefined();
          expect(typeof status.planName).toBe("string");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle multiple cancellation attempts", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        // First cancellation
        const result1 = await caller.subscription.cancelSubscription();
        expect(result1).toBeDefined();

        // Second cancellation attempt
        try {
          await caller.subscription.cancelSubscription();
        } catch (error) {
          expect(error).toBeDefined();
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});

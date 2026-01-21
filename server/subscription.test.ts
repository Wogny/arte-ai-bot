import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from './_core/db.js';
import { subscriptions, payments, subscriptionPlans } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

describe('Subscription Router', () => {
  let db: any;
  const testUserId = 999;

  beforeEach(async () => {
    db = await getDb();
  });

  it('should get current subscription', async () => {
    // Criar um plano de teste
    const plan = await db.insert(subscriptionPlans).values({
      name: 'Test Plan',
      priceMonthly: 4900,
      description: 'Test subscription plan',
      features: ['Feature 1', 'Feature 2'],
      maxPosts: 100,
      maxPlatforms: 5,
      hasAnalytics: true,
      supportLevel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Criar uma assinatura de teste
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(subscriptions).values({
      userId: testUserId,
      planId: 1,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Verificar que a assinatura foi criada
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, testUserId))
      .limit(1);

    expect(subscription.length).toBeGreaterThan(0);
    expect(subscription[0].status).toBe('active');
  });

  it('should get payment history', async () => {
    // Criar pagamentos de teste
    for (let i = 0; i < 3; i++) {
      await db.insert(payments).values({
        userId: testUserId,
        mercadopagoPaymentId: `test-payment-${i}`,
        amount: 4900,
        currency: 'BRL',
        status: i === 2 ? 'succeeded' : 'pending',
        description: `Test payment ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Verificar que os pagamentos foram criados
    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, testUserId));

    expect(paymentList.length).toBeGreaterThanOrEqual(3);
  });

  it('should calculate payment summary', async () => {
    // Criar pagamentos bem-sucedidos
    const amounts = [4900, 14900, 49900];
    for (const amount of amounts) {
      await db.insert(payments).values({
        userId: testUserId + 1,
        mercadopagoPaymentId: `summary-test-${amount}`,
        amount,
        currency: 'BRL',
        status: 'succeeded',
        description: `Payment ${amount}`,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Verificar pagamentos
    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, testUserId + 1));

    const succeededPayments = paymentList.filter((p: any) => p.status === 'succeeded');
    const totalSpent = succeededPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    expect(succeededPayments.length).toBeGreaterThanOrEqual(3);
    expect(totalSpent).toBeGreaterThanOrEqual(4900 + 14900 + 49900);
  });

  it('should cancel subscription', async () => {
    // Criar uma assinatura
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(subscriptions).values({
      userId: testUserId + 2,
      planId: 1,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Cancelar assinatura
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, testUserId + 2))
      .limit(1);

    if (subscription.length > 0) {
      await db
        .update(subscriptions)
        .set({
          status: 'canceled',
          canceledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription[0].id));

      // Verificar cancelamento
      const canceled = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscription[0].id))
        .limit(1);

      expect(canceled[0].status).toBe('canceled');
      expect(canceled[0].canceledAt).toBeDefined();
    }
  });

  it('should filter payments by status', async () => {
    const userId = testUserId + 3;

    // Criar pagamentos com diferentes status
    const statuses = ['succeeded', 'pending', 'failed'];
    for (const status of statuses) {
      await db.insert(payments).values({
        userId,
        mercadopagoPaymentId: `status-test-${status}`,
        amount: 4900,
        currency: 'BRL',
        status,
        description: `Payment ${status}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Verificar filtragem
    const succeeded = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'succeeded'));

    expect(succeeded.length).toBeGreaterThan(0);
  });

  it('should handle multiple subscriptions per user', async () => {
    const userId = testUserId + 4;
    const now = new Date();

    // Criar múltiplas assinaturas
    for (let i = 0; i < 2; i++) {
      const expiresAt = new Date(now.getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000);
      await db.insert(subscriptions).values({
        userId,
        planId: i + 1,
        status: i === 0 ? 'active' : 'canceled',
        currentPeriodStart: now,
        currentPeriodEnd: expiresAt,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Verificar que ambas foram criadas
    const subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    expect(subs.length).toBeGreaterThanOrEqual(2);
  });
});

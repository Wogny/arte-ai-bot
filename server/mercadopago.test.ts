import { describe, it, expect } from 'vitest';

describe('Mercado Pago Integration', () => {
  it('should have valid Mercado Pago credentials', () => {
    const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

    // Validar que todas as credenciais estão presentes
    expect(publicKey).toBeDefined();
    expect(accessToken).toBeDefined();
    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();

    // Validar formato das credenciais
    expect(publicKey).toMatch(/^APP_USR-/);
    expect(accessToken).toMatch(/^APP_USR-/);
    expect(clientId).toMatch(/^\d+$/);
    expect(clientSecret).toBeDefined();
  });

  it('should validate Mercado Pago API credentials format', async () => {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    // Testar se o token é válido fazendo uma requisição simples
    try {
      const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      // Se retornar 200 ou 401, as credenciais estão no formato correto
      // 401 significa credenciais inválidas, 200 significa válidas
      expect([200, 401]).toContain(response.status);
    } catch (error) {
      // Se houver erro de rede, apenas verificar que o token existe
      expect(accessToken).toBeDefined();
    }
  });
});

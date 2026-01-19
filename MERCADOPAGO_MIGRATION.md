# Migração de Stripe para Mercado Pago

## Resumo da Migração

Este documento descreve a migração completa do sistema de pagamento de Stripe para Mercado Pago no projeto Arte AI Bot.

## Mudanças Realizadas

### 1. Remoção do Stripe

- ✅ Removido pacote `stripe` do `package.json`
- ✅ Removido import do webhook do Stripe em `server/_core/index.ts`
- ✅ Removido arquivo `server/stripe/webhook.ts`
- ✅ Atualizado `server/_core/env.ts` removendo variáveis do Stripe
- ✅ Atualizado `client/src/pages/SupportCenter.tsx` removendo referências ao Stripe
- ✅ Atualizado `client/src/pages/Upgrade.tsx` removendo referências ao Stripe

### 2. Implementação do Mercado Pago

#### Componentes Frontend
- **MercadoPagoPaymentForm.tsx**: Componente React que integra o SDK do Mercado Pago
  - Suporta 3 métodos de pagamento: Cartão de Crédito, Pix e Boleto
  - Validação de dados de pagamento
  - Integração com API de checkout

#### Roteador Backend
- **server/routers/mercadopago.ts**: Roteador tRPC para operações do Mercado Pago
  - Criação de preferências de pagamento
  - Consulta de status de pagamento
  - Gerenciamento de assinaturas

#### Webhook
- **server/routes/mercadopago-webhook.ts**: Webhook para receber notificações de pagamento
  - Processa notificações de pagamento aprovado
  - Ativa automaticamente assinaturas
  - Registra pagamentos no banco de dados
  - Endpoint: `POST /api/mercadopago/webhook`

### 3. Banco de Dados

#### Tabelas Utilizadas

**subscriptions**
- `id`: ID da assinatura
- `userId`: ID do usuário
- `planId`: ID do plano
- `mercadopagoCustomerId`: ID do cliente no Mercado Pago
- `mercadopagoSubscriptionId`: ID da assinatura no Mercado Pago
- `status`: Status da assinatura (active, paused, canceled, past_due)
- `currentPeriodStart`: Início do período atual
- `currentPeriodEnd`: Fim do período atual
- `canceledAt`: Data do cancelamento
- `trialEndsAt`: Fim do período de trial
- `isTrialActive`: Se o trial está ativo

**payments**
- `id`: ID do pagamento
- `userId`: ID do usuário
- `subscriptionId`: ID da assinatura (opcional)
- `mercadopagoPaymentId`: ID do pagamento no Mercado Pago
- `mercadopagoPreferenceId`: ID da preferência no Mercado Pago
- `amount`: Valor em centavos
- `currency`: Moeda (BRL)
- `status`: Status do pagamento (succeeded, pending, failed, refunded)
- `description`: Descrição do pagamento
- `paidAt`: Data do pagamento
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

### 4. Fluxo de Pagamento

```
1. Usuário seleciona plano na página de preços
2. Modal de pagamento abre com MercadoPagoPaymentForm
3. Usuário seleciona método de pagamento (Cartão, Pix ou Boleto)
4. Dados são enviados para o Mercado Pago
5. Mercado Pago processa o pagamento
6. Webhook recebe notificação de pagamento
7. Sistema ativa assinatura automaticamente
8. Usuário recebe confirmação
```

### 5. Métodos de Pagamento Suportados

1. **Cartão de Crédito**
   - Suporta parcelamento
   - Processamento imediato
   - Melhor taxa de aprovação

2. **Pix**
   - Transferência instantânea
   - Sem taxa para o cliente
   - Código QR gerado automaticamente

3. **Boleto**
   - Pagamento diferido
   - Código de barras gerado
   - Confirmação manual necessária

## Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias:

```env
MERCADOPAGO_ACCESS_TOKEN=seu_access_token
MERCADOPAGO_CLIENT_ID=seu_client_id
MERCADOPAGO_CLIENT_SECRET=seu_client_secret
MERCADOPAGO_PUBLIC_KEY=sua_public_key
```

## Testes

### Testes Unitários

Execute os testes de pagamento:

```bash
pnpm test server/mercadopago-payment.test.ts
```

Os testes cobrem:
- Criação de registros de pagamento
- Ativação de assinaturas
- Suporte a múltiplos métodos de pagamento
- Renovação de assinaturas
- Tratamento de falhas de pagamento
- Histórico de pagamentos

### Testes Manuais

1. Navegue para `/pricing`
2. Clique em "Começar Agora" para um plano
3. Selecione um método de pagamento
4. Complete o pagamento (use dados de teste do Mercado Pago)
5. Verifique se a assinatura foi ativada no dashboard

## Configuração do Webhook

Para receber notificações de pagamento do Mercado Pago:

1. Acesse o painel do Mercado Pago
2. Vá para Configurações > Webhooks
3. Adicione a URL: `https://seu-dominio.com/api/mercadopago/webhook`
4. Selecione os eventos: `payment.created`, `payment.updated`
5. Salve a configuração

## Migração de Dados Existentes

Se você tinha assinaturas do Stripe, será necessário:

1. Exportar dados das assinaturas do Stripe
2. Mapear IDs de clientes para o Mercado Pago
3. Recriar assinaturas no novo sistema
4. Validar que todos os usuários foram migrados

## Troubleshooting

### Webhook não recebe notificações
- Verifique se a URL está correta e acessível
- Confirme que o token de acesso está válido
- Verifique os logs do servidor

### Pagamento não ativa assinatura
- Verifique se o webhook foi recebido
- Confirme que o status do pagamento é "approved"
- Verifique os logs do banco de dados

### Erro ao processar pagamento
- Verifique as credenciais do Mercado Pago
- Confirme que o plano existe no banco de dados
- Verifique se há espaço em disco no servidor

## Próximos Passos

1. ✅ Remover Stripe
2. ✅ Implementar Mercado Pago
3. ✅ Configurar webhook
4. ✅ Testar fluxo de pagamento
5. ⏳ Monitorar pagamentos em produção
6. ⏳ Coletar feedback dos usuários
7. ⏳ Otimizar taxas de conversão

## Suporte

Para dúvidas sobre a integração do Mercado Pago, consulte:
- [Documentação do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [SDK JavaScript do Mercado Pago](https://github.com/mercadopago/sdk-js)

## Histórico de Mudanças

- **2026-01-08**: Migração completa de Stripe para Mercado Pago
  - Removido Stripe
  - Implementado Mercado Pago
  - Criado webhook
  - Testes implementados

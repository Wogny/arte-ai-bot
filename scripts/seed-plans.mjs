/**
 * Script para inserir os planos de assinatura no banco de dados
 * Execute com: node scripts/seed-plans.mjs
 */

import { createConnection } from "mysql2/promise";

const PLANS = [
  {
    name: "STARTER",
    priceMonthly: 4900,  // R$ 49,00 em centavos
    priceYearly: 58800,  // R$ 588,00 em centavos
    description: "Para começar",
    features: JSON.stringify([
      "50 Posts/mês",
      "Instagram + TikTok",
      "Analytics Básico",
      "Agendamento Simples",
    ]),
    maxPosts: 50,
    maxPlatforms: 2,
    maxCampaigns: 3,
    maxUsers: 1,
    isActive: true,
  },
  {
    name: "PROFESSIONAL",
    priceMonthly: 14900, // R$ 149,00 em centavos
    priceYearly: 178800, // R$ 1.788,00 em centavos
    description: "Mais popular",
    features: JSON.stringify([
      "500 Posts/mês",
      "Todas as Redes (IG, TK, FB, LI, TW)",
      "Analytics Avançado",
      "Equipe até 5",
      "Biblioteca de Mídia",
      "Modelos de Conteúdo",
    ]),
    maxPosts: 500,
    maxPlatforms: 5,
    maxCampaigns: 20,
    maxUsers: 5,
    isActive: true,
  },
  {
    name: "ENTERPRISE",
    priceMonthly: 49900, // R$ 499,00 em centavos
    priceYearly: 598800, // R$ 5.988,00 em centavos
    description: "Para grandes equipes",
    features: JSON.stringify([
      "Posts ilimitados",
      "Integrações Customizadas",
      "Suporte 24/7 Prioritário",
      "Equipe ilimitada",
      "API de Acesso",
      "Gerente de Conta Dedicado",
    ]),
    maxPosts: -1, // ilimitado
    maxPlatforms: -1,
    maxCampaigns: -1,
    maxUsers: -1,
    isActive: true,
  },
];

async function seedPlans() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL não configurada");
    process.exit(1);
  }

  // Parse DATABASE_URL
  const url = new URL(databaseUrl);
  const connection = await createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  console.log("Conectado ao banco de dados");

  try {
    // Verificar se já existem planos
    const [existingPlans] = await connection.query("SELECT COUNT(*) as count FROM subscription_plans");
    const count = existingPlans[0].count;

    if (count > 0) {
      console.log(`Já existem ${count} planos no banco. Atualizando...`);
      
      for (const plan of PLANS) {
        await connection.query(
          `UPDATE subscription_plans SET 
            priceMonthly = ?, 
            priceYearly = ?, 
            description = ?, 
            features = ?, 
            maxPosts = ?, 
            maxPlatforms = ?, 
            maxCampaigns = ?, 
            maxUsers = ?,
            isActive = ?
          WHERE name = ?`,
          [
            plan.priceMonthly,
            plan.priceYearly,
            plan.description,
            plan.features,
            plan.maxPosts,
            plan.maxPlatforms,
            plan.maxCampaigns,
            plan.maxUsers,
            plan.isActive,
            plan.name,
          ]
        );
        console.log(`Plano ${plan.name} atualizado`);
      }
    } else {
      console.log("Inserindo planos...");
      
      for (const plan of PLANS) {
        await connection.query(
          `INSERT INTO subscription_plans 
            (name, priceMonthly, priceYearly, description, features, maxPosts, maxPlatforms, maxCampaigns, maxUsers, isActive) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            plan.name,
            plan.priceMonthly,
            plan.priceYearly,
            plan.description,
            plan.features,
            plan.maxPosts,
            plan.maxPlatforms,
            plan.maxCampaigns,
            plan.maxUsers,
            plan.isActive,
          ]
        );
        console.log(`Plano ${plan.name} inserido`);
      }
    }

    // Listar planos
    const [plans] = await connection.query("SELECT id, name, priceMonthly, priceYearly FROM subscription_plans");
    console.log("\nPlanos no banco de dados:");
    console.table(plans);

  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await connection.end();
    console.log("\nConexão fechada");
  }
}

seedPlans();

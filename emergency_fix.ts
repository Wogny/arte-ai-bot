import "dotenv/config";
import { getDb } from "./server/db.js";
import { users } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function fixUser() {
  const email = "sem452001@hotmail.com";
  const tempPassword = "SenhaTemporaria123!";
  const passwordHash = hashPassword(tempPassword);

  console.log(`[Emergency] Iniciando correção para o usuário: ${email}`);
  
  try {
    const db = await getDb();
    if (!db) throw new Error("Não foi possível conectar ao banco de dados");

    // 1. Verificar se o usuário existe
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (result.length === 0) {
      console.error(`[Emergency] Usuário ${email} não encontrado no banco de dados.`);
      process.exit(1);
    }

    const user = result[0];
    console.log(`[Emergency] Usuário encontrado. ID: ${user.id}, Status atual: ${user.emailVerified ? 'Verificado' : 'Não verificado'}`);

    // 2. Atualizar status e senha
    await db.update(users)
      .set({ 
        emailVerified: true, 
        passwordHash: passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    console.log(`[Emergency] SUCESSO!`);
    console.log(`[Emergency] Usuário: ${email}`);
    console.log(`[Emergency] Status: VERIFICADO`);
    console.log(`[Emergency] Nova Senha: ${tempPassword}`);
    console.log(`[Emergency] Agora você pode fazer login normalmente.`);

  } catch (error) {
    console.error("[Emergency] Erro fatal:", error);
  } finally {
    process.exit(0);
  }
}

fixUser();

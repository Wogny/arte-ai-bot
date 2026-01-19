import * as crypto from 'crypto';
import { ENV } from './env.js';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// A chave é derivada da variável de ambiente ENCRYPTION_KEY
// Garantimos que a chave tenha exatamente 32 bytes (256 bits) para o AES-256
const ENCRYPTION_KEY_BUFFER = crypto.createHash('sha256').update(ENV.ENCRYPTION_KEY || 'default-secret-key').digest();

/**
 * Criptografa uma string de texto simples usando AES-256-CBC.
 * @param text O texto simples a ser criptografado.
 * @returns O texto criptografado como uma string hexadecimal com o IV anexado.
 */
export function encrypt(text: string): string {
  if (!ENV.ENCRYPTION_KEY) {
    console.warn("Aviso: ENCRYPTION_KEY não definida. Os dados não serão criptografados com segurança.");
    return text;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Anexa o IV aos dados criptografados para descriptografia
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Descriptografa uma string criptografada usando AES-256-CBC.
 * @param text O texto criptografado (string hexadecimal com o IV anexado).
 * @returns A string de texto simples descriptografada.
 */
export function decrypt(text: string): string {
  if (!ENV.ENCRYPTION_KEY) return text;

  const parts = text.split(':');
  if (parts.length !== 2) {
    // Retorna o texto original se não estiver no formato IV:EncryptedData
    return text; 
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Erro durante a descriptografia:", error);
    // Em caso de erro (ex: chave errada, dados corrompidos), retorna o texto original ou lança um erro
    return text; 
  }
}

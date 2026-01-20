import nodemailer from "nodemailer";
import "dotenv/config";

/**
 * Configuração do transportador de email
 * Suporta SMTP (Gmail, Outlook, Resend, SendGrid, etc.)
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Interface para opções de envio de email
 */
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia um email usando o transportador configurado
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "MKT Gerenciador"}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ""), // Fallback para texto puro
      html,
    });

    console.log(`[EmailService] Email enviado para ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EmailService] Erro ao enviar email:", error);
    // Em desenvolvimento, não travamos o fluxo se o email falhar
    if (process.env.NODE_ENV === "development") {
      console.warn("[EmailService] Falha no envio de email ignorada em modo desenvolvimento.");
      return { success: true, messageId: "dev-mock-id" };
    }
    throw error;
  }
}

/**
 * Template de email de verificação
 */
export function getVerificationEmailTemplate(name: string, url: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8b5cf6; margin-bottom: 10px;">MKT Gerenciador</h1>
        <p style="font-size: 18px; color: #666;">Verifique seu endereço de email</p>
      </div>
      
      <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Obrigado por se cadastrar no MKT Gerenciador. Para começar a criar conteúdos incríveis com IA, precisamos que você confirme seu email.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${url}" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Confirmar meu Email
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p style="font-size: 12px; color: #8b5cf6; word-break: break-all;">${url}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>Este link expira em 24 horas.</p>
        <p>Se você não criou uma conta, pode ignorar este email.</p>
        <p>&copy; 2026 MKT Gerenciador. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
}

/**
 * Template de email de recuperação de senha
 */
export function getPasswordResetEmailTemplate(name: string, url: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8b5cf6; margin-bottom: 10px;">MKT Gerenciador</h1>
        <p style="font-size: 18px; color: #666;">Recuperação de Senha</p>
      </div>
      
      <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no MKT Gerenciador.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${url}" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Redefinir minha Senha
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">Se você não solicitou a alteração da senha, ignore este email. Sua senha atual permanecerá segura.</p>
        <p style="font-size: 14px; color: #666; margin-top: 20px;">Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p style="font-size: 12px; color: #8b5cf6; word-break: break-all;">${url}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>Este link expira em 1 hora.</p>
        <p>&copy; 2026 MKT Gerenciador. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
}

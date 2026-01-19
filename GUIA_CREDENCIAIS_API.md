# 📚 Guia Completo: Como Obter Credenciais de APIs

Este guia mostra passo-a-passo como obter as chaves de API necessárias para o MKT Gerenciador.

---

## 1. Stable Diffusion (Geração de Imagens)

### Opção A: Replicate (Recomendado - Mais fácil)

1. Acesse https://replicate.com
2. Clique em "Sign up" (ou faça login se já tem conta)
3. Confirme seu email
4. Vá para https://replicate.com/account/api-tokens
5. Copie seu token (começa com `r8_`)
6. **Adicione em Settings → Secrets:**
   - Chave: `REPLICATE_API_TOKEN`
   - Valor: `r8_xxxxx...`

**Preço:** Primeira geração é grátis, depois $0.01-0.05 por imagem

---

### Opção B: Hugging Face

1. Acesse https://huggingface.co
2. Clique em "Sign up"
3. Confirme seu email
4. Vá para https://huggingface.co/settings/tokens
5. Crie um novo token (role: read)
6. **Adicione em Settings → Secrets:**
   - Chave: `HUGGINGFACE_API_KEY`
   - Valor: `hf_xxxxx...`

**Preço:** Grátis com limite de requisições

---

## 2. Instagram Graph API

### Passo-a-passo:

1. Acesse https://developers.facebook.com
2. Clique em "Get Started"
3. Crie uma conta de desenvolvedor (preencha formulário)
4. Vá para "My Apps" → "Create App"
5. Escolha "Business" como tipo
6. Preencha as informações do app
7. Adicione o produto "Instagram Graph API"
8. Vá para "Settings" → "Basic"
9. Copie:
   - **App ID** (ex: 123456789)
   - **App Secret** (ex: abc123def456...)
10. Gere um "User Access Token" em "Tools" → "Access Token Tool"
11. **Adicione em Settings → Secrets:**
    - `INSTAGRAM_APP_ID`: seu App ID
    - `INSTAGRAM_APP_SECRET`: seu App Secret
    - `INSTAGRAM_ACCESS_TOKEN`: seu User Access Token

**Preço:** Grátis

---

## 3. Facebook Graph API

### Passo-a-passo:

1. Use a mesma conta de desenvolvedor do Instagram (Facebook Developers)
2. Vá para seu app criado anteriormente
3. Adicione o produto "Facebook Login"
4. Configure "Valid OAuth Redirect URIs":
   - `https://seu-dominio.com/api/oauth/facebook/callback`
5. Copie:
   - **App ID** (mesmo do Instagram)
   - **App Secret** (mesmo do Instagram)
6. Gere um "Page Access Token" em "Tools" → "Access Token Tool"
7. **Adicione em Settings → Secrets:**
    - `FACEBOOK_APP_ID`: seu App ID
    - `FACEBOOK_APP_SECRET`: seu App Secret
    - `FACEBOOK_PAGE_ACCESS_TOKEN`: seu Page Access Token

**Preço:** Grátis

---

## 4. TikTok API

### Passo-a-passo:

1. Acesse https://developers.tiktok.com
2. Clique em "Register"
3. Crie uma conta de desenvolvedor
4. Vá para "Applications" → "Create an application"
5. Escolha "Web" como plataforma
6. Preencha as informações:
   - App name: "MKT Gerenciador"
   - Redirect URL: `https://seu-dominio.com/api/oauth/tiktok/callback`
7. Selecione os escopos necessários:
   - `user.info.basic`
   - `video.list`
   - `video.publish`
8. Copie:
   - **Client ID** (ex: aw123xyz...)
   - **Client Secret** (ex: xyz789abc...)
9. **Adicione em Settings → Secrets:**
    - `TIKTOK_CLIENT_ID`: seu Client ID
    - `TIKTOK_CLIENT_SECRET`: seu Client Secret

**Preço:** Grátis (com limite de requisições)

---

## 5. Adicionar Credenciais no MKT Gerenciador

### Passo-a-passo:

1. Acesse seu dashboard do MKT Gerenciador
2. Clique em "Settings" (engrenagem no canto superior direito)
3. Vá para a aba "Secrets"
4. Clique em "Add Secret"
5. Preencha:
   - **Key:** Nome da variável (ex: `REPLICATE_API_TOKEN`)
   - **Value:** Sua chave de API
6. Clique em "Save"
7. Reinicie o servidor (o sistema fará isso automaticamente)

---

## 📋 Checklist de Credenciais

- [ ] Stable Diffusion (Replicate ou Hugging Face)
- [ ] Instagram App ID e Secret
- [ ] Instagram Access Token
- [ ] Facebook App ID e Secret
- [ ] Facebook Page Access Token
- [ ] TikTok Client ID e Secret

---

## ⚠️ Dicas de Segurança

1. **Nunca compartilhe suas chaves** — Elas são como senhas
2. **Use variáveis de ambiente** — Nunca coloque chaves no código
3. **Regenere tokens regularmente** — A cada 3-6 meses
4. **Monitore o uso** — Verifique se alguém não está usando suas chaves
5. **Revogar tokens antigos** — Delete tokens que não usa mais

---

## 🆘 Problemas Comuns

### "Invalid token"
- Verifique se copiou a chave completa
- Verifique se não tem espaços extras
- Regenere a chave e tente novamente

### "Rate limit exceeded"
- Espere alguns minutos antes de tentar novamente
- Considere um plano pago para maior limite

### "Unauthorized"
- Verifique se a chave está ativa
- Verifique se tem permissões corretas
- Regenere a chave

---

## 📞 Suporte

Se tiver dúvidas, entre em contato com o suporte de cada plataforma:
- Replicate: https://replicate.com/support
- Hugging Face: https://huggingface.co/support
- Facebook Developers: https://developers.facebook.com/support
- TikTok Developers: https://developers.tiktok.com/support

---

**Próximo passo:** Após obter as credenciais, adicione-as em Settings → Secrets e o MKT Gerenciador começará a usar as APIs automaticamente!

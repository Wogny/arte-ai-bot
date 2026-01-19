# Prioridades para Finalizar o MKT Gerenciador

## 🔴 CRÍTICAS (Bloqueiam o MVP)

### 1. Integrar Credenciais de APIs Externas
**Status:** Estrutura pronta, credenciais faltando
**O que fazer:**
- Adicionar chave de API do Stable Diffusion (para geração de imagens)
- Adicionar tokens de desenvolvedor do Instagram, Facebook, TikTok
- Adicionar credenciais do Mercado Pago (já parcialmente integrado)
- Adicionar chave de API de LLM (para geração de legendas)

**Impacto:** Sem isso, usuários não conseguem gerar imagens nem publicar em redes sociais

**Tempo estimado:** 2-3 horas (depende de você obter as credenciais)

---

### 2. Testar Fluxo Completo de Pagamento
**Status:** Backend pronto, frontend pronto, webhook pronto
**O que fazer:**
- Fazer teste end-to-end com pagamento real (ou sandbox do Mercado Pago)
- Validar que assinatura é ativada após pagamento
- Testar renovação automática de assinatura
- Testar cancelamento de assinatura
- Validar que usuário perde acesso a features premium após cancelamento

**Impacto:** Monetização não funciona sem isso

**Tempo estimado:** 2-3 horas

---

### 3. Implementar Página de Login/Registro com Email
**Status:** Backend pronto (procedures tRPC), frontend faltando
**O que fazer:**
- Criar página de registro com validação de email
- Criar página de login com email/senha
- Implementar recuperação de senha
- Adicionar verificação de email (envio de link)
- Integrar com OAuth existente (opção de login com Manus)

**Impacto:** Usuários não conseguem criar conta sem isso

**Tempo estimado:** 4-5 horas

---

### 4. Criar Interface de Geração de Imagens
**Status:** Backend pronto, frontend faltando
**O que fazer:**
- Criar página dedicada para geração de imagens
- Adicionar campo de entrada para prompt
- Adicionar seletor de estilo (8 opções)
- Mostrar imagens geradas em galeria
- Adicionar botão para usar imagem em novo post

**Impacto:** Funcionalidade principal do produto não está acessível

**Tempo estimado:** 3-4 horas

---

### 5. Criar Interface de Publicação em Redes Sociais
**Status:** Backend pronto, frontend faltando
**O que fazer:**
- Criar página de criação de post com:
  - Campo de legenda
  - Upload/seleção de imagem
  - Seletor de plataformas (Instagram, Facebook, TikTok)
  - Opção de publicar agora ou agendar
- Mostrar preview do post
- Listar posts publicados com status

**Impacto:** Usuários não conseguem publicar posts

**Tempo estimado:** 4-5 horas

---

## 🟡 ALTAS PRIORIDADES (Melhoram experiência)

### 6. Dashboard com Dados Reais
**Status:** Parcialmente pronto
**O que fazer:**
- Conectar métricas reais (posts este mês, alcance, engajamento)
- Mostrar próximo post agendado
- Exibir performance das últimas publicações
- Adicionar gráficos de tendência

**Impacto:** Dashboard não mostra dados úteis

**Tempo estimado:** 2-3 horas

---

### 7. Notificações por Email
**Status:** Não implementado
**O que fazer:**
- Enviar email de confirmação após registro
- Enviar email de confirmação de pagamento
- Enviar email 7 dias antes de renovação de assinatura
- Enviar notificação quando post é publicado com sucesso
- Enviar resumo semanal de performance

**Impacto:** Usuários perdem contexto sobre ações importantes

**Tempo estimado:** 3-4 horas

---

### 8. Página de Conexão de Redes Sociais
**Status:** Parcialmente pronto
**O que fazer:**
- Criar interface para conectar contas de Instagram, Facebook, TikTok
- Exibir status de conexão (conectado/expirado/erro)
- Permitir desconectar contas
- Mostrar data de expiração do token
- Adicionar botão para reconectar

**Impacto:** Usuários não sabem quais redes estão conectadas

**Tempo estimado:** 2-3 horas

---

### 9. Página de Histórico de Posts
**Status:** Estrutura pronta, interface faltando
**O que fazer:**
- Listar todos os posts publicados
- Filtrar por plataforma, período, status
- Mostrar métricas (likes, comentários, compartilhamentos)
- Permitir deletar posts
- Permitir republicar posts antigos

**Impacto:** Usuários não conseguem gerenciar histórico

**Tempo estimado:** 2-3 horas

---

### 10. Página de Agendamento de Posts
**Status:** Backend pronto, interface faltando
**O que fazer:**
- Criar calendário visual para agendamento
- Permitir arrastar e soltar posts
- Mostrar posts agendados por dia/semana/mês
- Permitir editar/deletar posts agendados
- Mostrar próximos posts a publicar

**Impacto:** Usuários não conseguem visualizar agenda

**Tempo estimado:** 3-4 horas

---

## 🟢 MÉDIAS PRIORIDADES (Polish)

### 11. Página de Modelos/Templates
**Status:** Backend pronto, interface faltando
**O que fazer:**
- Exibir biblioteca de templates de posts
- Filtrar por nicho (fitness, moda, food, etc)
- Permitir usar template como base para novo post
- Permitir criar templates personalizados
- Mostrar templates favoritos

**Impacto:** Usuários têm que criar tudo do zero

**Tempo estimado:** 2-3 horas

---

### 12. Análise de Competitors
**Status:** Backend pronto, interface faltando
**O que fazer:**
- Criar página para adicionar competitors
- Mostrar posts dos competitors
- Comparar performance (likes, comentários)
- Sugerir hashtags baseado em competitors
- Mostrar melhor horário para postar

**Impacto:** Usuários não conseguem fazer análise competitiva

**Tempo estimado:** 3-4 horas

---

### 13. Suporte ao Vivo (Chat)
**Status:** Não implementado
**O que fazer:**
- Integrar chat widget (Zendesk, Intercom, ou similar)
- Criar página de FAQ
- Criar base de conhecimento com artigos
- Sistema de tickets de suporte
- Notificações de resposta

**Impacto:** Usuários não conseguem obter ajuda rápida

**Tempo estimado:** 4-5 horas

---

### 14. Autenticação 2FA
**Status:** Backend pronto, interface faltando
**O que fazer:**
- Criar página de configuração de 2FA
- Gerar QR code para autenticador
- Permitir backup codes
- Forçar 2FA para contas premium
- Logout remoto de sessões

**Impacto:** Segurança da conta

**Tempo estimado:** 2-3 horas

---

### 15. Página de Configurações do Usuário
**Status:** Parcialmente pronto
**O que fazer:**
- Editar perfil (nome, email, foto)
- Mudar senha
- Gerenciar notificações
- Configurar preferências de privacidade
- Exportar dados (LGPD)
- Deletar conta

**Impacto:** Usuários não conseguem gerenciar conta

**Tempo estimado:** 2-3 horas

---

## 🔵 BAIXAS PRIORIDADES (Futuro)

### 16. Integração WhatsApp Business
**Status:** Backend pronto, interface faltando
**O que fazer:**
- Conectar conta WhatsApp Business
- Enviar mensagens via WhatsApp
- Receber respostas de clientes
- Criar templates de mensagens
- Integrar com CRM

**Tempo estimado:** 5-6 horas

---

### 17. API Pública
**Status:** Não implementado
**O que fazer:**
- Documentar endpoints da API
- Criar chaves de API por usuário
- Rate limiting
- Webhooks para eventos
- SDK em JavaScript/Python

**Tempo estimado:** 5-6 horas

---

### 18. White Label
**Status:** Não implementado
**O que fazer:**
- Permitir customizar logo/cores
- Customizar domínio
- Remover branding do MKT Gerenciador
- Customizar emails

**Tempo estimado:** 3-4 horas

---

### 19. Integração com Ferramentas Externas
**Status:** Não implementado
**O que fazer:**
- Zapier
- Make.com
- Integração com Google Analytics
- Integração com Mailchimp

**Tempo estimado:** 4-5 horas por integração

---

### 20. Mobile App
**Status:** Não implementado
**O que fazer:**
- Versão mobile responsiva (já existe)
- App nativa iOS/Android
- Push notifications
- Offline mode

**Tempo estimado:** 20-30 horas

---

## 📊 RESUMO DE TEMPO

| Prioridade | Quantidade | Tempo Total |
|-----------|-----------|------------|
| 🔴 Críticas | 5 | 15-20 horas |
| 🟡 Altas | 5 | 16-20 horas |
| 🟢 Médias | 5 | 15-18 horas |
| 🔵 Baixas | 5 | 37-50 horas |
| **TOTAL** | **20** | **83-108 horas** |

---

## 🚀 RECOMENDAÇÃO

**Para MVP funcional (Fase 1):** Implementar itens 1-5 (15-20 horas)
- Usuários conseguem registrar, gerar imagens, publicar em redes sociais, pagar

**Para Produto Completo (Fase 2):** Adicionar itens 6-10 (16-20 horas)
- Dashboard funcional, histórico, agendamento, notificações

**Para Produto Premium (Fase 3):** Adicionar itens 11-15 (15-18 horas)
- Templates, análise competitiva, suporte, segurança

**Para Escala (Fase 4):** Adicionar itens 16-20 (37-50 horas)
- WhatsApp, API, White Label, Mobile

---

## 📋 PRÓXIMOS PASSOS IMEDIATOS

1. **Esta semana:** Itens 1-3 (integrar credenciais, testar pagamento, criar login)
2. **Próxima semana:** Itens 4-5 (criar interfaces de geração e publicação)
3. **Semana 3:** Itens 6-7 (dashboard e notificações)
4. **Semana 4:** Itens 8-10 (conexões, histórico, agendamento)

Isso coloca o produto em estado de MVP pronto para vender em 4 semanas.

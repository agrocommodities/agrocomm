# AgroComm — Documentação do Projeto

## Visão Geral

Plataforma de cotações de commodities agropecuárias (grãos e pecuária) para o mercado brasileiro. Coleta dados via scraping de múltiplas fontes, exibe cotações internacionais da Bolsa de Chicago (CBOT) em tempo real via Socket.IO, e agrega notícias do agronegócio com sistema de tags e categorias.

- **Domínio:** agrocomm.com.br
- **Stack:** Next.js 16.1.6 (App Router + Custom Server + TypeScript), Socket.IO, Drizzle ORM, SQLite, pnpm
- **Node.js:** v24.14.0 (gerenciado via fnm)
- **Servidor:** VPS Rocky Linux 9, Nginx (proxy reverso), systemd

---

## Funcionalidades Principais

### 🏠 Página Inicial
- Cotações do dia organizadas por categoria (Pecuária e Grãos)
- **Sidebar com cotações internacionais (CBOT)** — atualização em tempo real via Socket.IO
  - Dropdown para selecionar commodity: Soja, Milho, Boi Gordo
  - Gráfico de tendência com ponto piscante indicando valor atual
  - Dados vindos da Bolsa de Chicago (CME Group) via Yahoo Finance API
- **Destaques de notícias** — cards com as últimas notícias do agronegócio

### 📊 Cotações em Tempo Real (CBOT)
- Socket.IO integrado ao custom server (`src/server.ts`)
- Busca preços a cada 60 segundos da Yahoo Finance API (futures: ZS=F, ZC=F, LE=F)
- Broadcast automático para clientes subscritos
- Fallback via API REST (`/api/commodities`) para SSR
- Histórico de 5 dias com gráfico de tendência

### 📰 Sistema de Notícias
- **Conteúdo completo salvo no banco** — campo `content` (HTML) na tabela `news_articles`
- **Citação da fonte original** — sempre exibe nome da fonte e link para o artigo original
- **Sistema de tags/categorias** — tags auto-extraídas das páginas ou geradas a partir do título
- **Nuvem de tags** — sidebar responsiva na página de notícias para filtrar por tag
- **Scraping automático** — coleta notícias 2x/dia (configurável via systemd)
- **Deduplicação** — constraint única no `sourceUrl` previne duplicatas

### ❓ Páginas Institucionais (Rotas Paralelas)
Implementadas usando o conceito de **Parallel Routes** do Next.js:
- **Ajuda** (`/ajuda`) — explica commodities, precificação (bushel, arroba), investimentos
- **Sobre** (`/sobre`) — descrição da plataforma e funcionalidades
- **Suporte** (`/suporte`) — formulário de contato com Nodemailer

Cada página funciona como:
- **Página completa** quando acessada diretamente (ex: `/ajuda`)
- **Modal** quando navegada a partir de outra página (rotas interceptadas via `@modal/(.)ajuda`)

### 💳 Sistema de Assinaturas (Mercado Pago)

Planos mensais e semanais com checkout transparente (o usuário nunca sai do site).

#### Planos

| Plano  | Mensal   | Semanal  | Anúncios | Histórico | Boletins |
|--------|----------|----------|----------|-----------|----------|
| Bronze | R$19,90  | R$6,90   | 3        | 30 dias   | Sim      |
| Prata  | R$39,90  | R$12,90  | 10       | 90 dias   | Sim      |
| Ouro   | R$79,90  | R$24,90  | Ilimitado| 365 dias  | Sim      |

Preços e benefícios são configuráveis pelo admin em `/admin/assinaturas`.

#### Métodos de pagamento
- **Pix** — QR code exibido na tela + código copia-e-cola
- **Cartão de crédito/débito** — processamento direto via Payment Brick
- **Boleto** — link gerado para pagamento

#### Checkout transparente
Usa o **Payment Brick** do Mercado Pago (SDK JS `@mercadopago/sdk-react`). O brick renderiza dentro da página de checkout e coleta os dados de pagamento sem redirecionamento externo.

#### Fluxo de pagamento
1. Usuário seleciona plano em `/planos` (ou modal)
2. Vai para `/planos/checkout/[slug]` — Payment Brick renderizado
3. Brick envia dados → `POST /api/payments/create` cria o pagamento via SDK
4. Webhook `POST /api/payments/webhook` recebe notificação do MP
5. Webhook atualiza status da assinatura e dispara emails

#### Benefícios por plano
- **Boletins por e-mail** — cotações selecionadas + notícias do agro (2x/dia, dias úteis)
- **Histórico de preços** — datepicker nas páginas de cotação para consultar preços anteriores
- **Limite de classificados** — controle por plano (Bronze: 3, Prata: 10, Ouro: ilimitado)
- **Notificação de cotações** — ícone de sino nas tabelas de cotação para acompanhar produtos

#### Admin
- `/admin/assinaturas` — 3 abas: Assinaturas, Planos, Alertas
- Conceder plano a usuário (temporário com data ou vitalício)
- Alterar/cancelar assinaturas
- Editar preços e benefícios de cada plano
- Configurar alertas de pagamento (cartão recusado, expiração, pix/boleto pendente)

#### Credenciais do Mercado Pago

Obtenha as credenciais no painel de desenvolvedor do Mercado Pago:

1. Acesse **[https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)**
2. Crie uma nova aplicação (ou selecione uma existente) — tipo **Checkout Transparente**, **API de Pagamentos**
3. Em **Credenciais de produção**, copie:
   - **Access Token** → `MERCADOPAGO_ACCESS_TOKEN`
   - **Public Key** → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
4. Em **Webhooks** (menu lateral):
   - Configure a URL: `https://seudominio.com.br/api/payments/webhook`
   - Selecione o evento: **Pagamentos**

Para testes, use as **Credenciais de teste** (sandbox) da mesma página. O Mercado Pago fornece cartões e usuários de teste para simular pagamentos.

> **Importante:** em desenvolvimento, use credenciais de teste. Em produção, troque para as credenciais de produção e configure o webhook com a URL real.

#### Boletins e alertas (systemd timer)

O script `src/db/bulletins.ts` roda via timer systemd (`agrocomm-bulletins.timer`), 2x/dia em dias úteis (07:00 e 17:00):

- **Boletim de cotações** — envia cotações acompanhadas pelo usuário
- **Boletim de notícias** — últimas notícias das últimas 24h
- **Alerta de expiração** — avisa N dias antes do vencimento
- **Alerta de expirado** — lembra quem deixou o plano vencer
- **Lembrete de Pix/boleto** — reenvia QR code ou link para pagamentos pendentes

```bash
# Status do timer
systemctl status agrocomm-bulletins.timer
journalctl -u agrocomm-bulletins.service -n 50

# Executar manualmente
pnpm tsx src/db/bulletins.ts
```

### 📬 Formulário de Contato
- Server Action salva mensagem na tabela `contact_messages`
- Envio de e-mail via **Nodemailer** (quando SMTP configurado)
- Template HTML inline no e-mail
- Validação server-side com limites de tamanho

---

## Estrutura de Pastas

```
agrocomm/
├── ansible/                   # Provisionamento da VPS
│   ├── inventory.ini
│   ├── playbook.yml
│   └── files/
│       ├── nginx/
│       │   └── agrocomm.conf
│       └── systemd/
│           ├── agrocomm.service
│           ├── agrocomm-scraper.service
│           ├── agrocomm-scraper.timer
│           ├── agrocomm-bulletins.service
│           └── agrocomm-bulletins.timer
├── drizzle/                   # Migrações geradas pelo drizzle-kit
├── scripts/
│   ├── ansible.sh
│   └── deploy.sh
├── src/
│   ├── config.ts              # Links de navegação (navLinks, footerLinks)
│   ├── server.ts              # Custom server Next.js + Socket.IO
│   ├── actions/
│   │   ├── admin.ts           # Ações de admin (CRUD, stats, scraping)
│   │   ├── admin-subscriptions.ts  # Admin: gerenciar assinaturas/planos/alertas
│   │   ├── auth.ts            # Login, registro, logout
│   │   ├── classifieds.ts     # CRUD classificados (com gate por plano)
│   │   ├── contact.ts         # Submit formulário de contato + Nodemailer
│   │   ├── news.ts            # Queries de notícias + tags
│   │   ├── quotes.ts          # Queries de cotações + histórico por data
│   │   └── subscriptions.ts   # Ações de assinatura do usuário
│   ├── app/
│   │   ├── layout.tsx         # Layout raiz (parallel route @modal)
│   │   ├── page.tsx           # Página inicial (cotações + sidebar CBOT + news drops)
│   │   ├── globals.css
│   │   ├── @modal/            # Parallel route: modais interceptados
│   │   │   ├── default.tsx
│   │   │   ├── (.)ajuda/page.tsx
│   │   │   ├── (.)sobre/page.tsx
│   │   │   ├── (.)suporte/page.tsx
│   │   │   └── (.)planos/
│   │   │       ├── page.tsx              # Modal: seletor de planos
│   │   │       └── checkout/[slug]/page.tsx  # Modal: checkout
│   │   ├── ajuda/page.tsx     # Página completa: Central de Ajuda
│   │   ├── sobre/page.tsx     # Página completa: Sobre a AgroComm
│   │   ├── suporte/page.tsx   # Página completa: Formulário de contato
│   │   ├── planos/
│   │   │   ├── page.tsx               # Seletor de planos
│   │   │   ├── resultado/page.tsx     # Resultado do pagamento
│   │   │   └── checkout/[slug]/page.tsx  # Checkout com Payment Brick
│   │   ├── admin/             # Dashboard admin (protegido)
│   │   │   └── assinaturas/page.tsx   # Admin: assinaturas/planos/alertas
│   │   ├── api/
│   │   │   ├── commodities/route.ts   # REST API: preços CBOT (SSR fallback)
│   │   │   ├── health/route.ts
│   │   │   ├── track/route.ts
│   │   │   ├── payments/
│   │   │   │   ├── create/route.ts    # Criar pagamento via MP SDK
│   │   │   │   ├── webhook/route.ts   # Webhook do Mercado Pago
│   │   │   │   └── status/[id]/route.ts  # Consultar status (polling Pix)
│   │   │   └── admin/
│   │   │       ├── scrape/route.ts
│   │   │       └── scrape-news/route.ts
│   │   ├── cotacoes/          # Páginas de cotações por produto
│   │   └── noticias/          # Lista de notícias + detalhe ([slug])
│   ├── components/
│   │   ├── CheckoutClient.tsx       # Fluxo checkout (form → resultado)
│   │   ├── CommoditiesTableClient.tsx
│   │   ├── CommoditySidebar.tsx     # Sidebar CBOT com Socket.IO + gráfico
│   │   ├── ContactForm.tsx          # Formulário de contato (client)
│   │   ├── Footer.tsx               # Footer com links ajuda/sobre/suporte
│   │   ├── Header.tsx
│   │   ├── HistoryDatePicker.tsx    # Datepicker para histórico de preços
│   │   ├── HistoryQuotesClient.tsx  # Wrapper: datepicker + tabela histórico
│   │   ├── Modal.tsx                # Modal genérico para parallel routes
│   │   ├── PaymentBrick.tsx         # Wrapper do Payment Brick MP
│   │   ├── PlanSelector.tsx         # Cards de planos com toggle mensal/semanal
│   │   ├── QuoteChart.tsx
│   │   ├── QuoteNotificationButton.tsx  # Sino de notificação por cotação
│   │   ├── QuoteSubscriptionManager.tsx # Gerenciar cotações acompanhadas
│   │   ├── ShareButtons.tsx
│   │   ├── SubscriptionCard.tsx     # Card do plano atual (/ajustes)
│   │   └── admin/
│   │       └── SubscriptionsManager.tsx  # Admin: manager de assinaturas
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts          # Todas as tabelas (incluindo assinaturas/pagamentos)
│   │   ├── seed.ts            # Seed: planos, alertas, permissões
│   │   ├── scrape.ts
│   │   └── bulletins.ts       # Script de boletins e alertas (systemd timer)
│   ├── emails/                # Templates Pug para emails
│   │   ├── subscription-welcome/    # Bem-vindo ao plano
│   │   ├── payment-success/         # Pagamento confirmado
│   │   ├── payment-failed/          # Falha no pagamento
│   │   ├── subscription-expiring/   # Plano expirando
│   │   ├── subscription-expired/    # Plano expirou
│   │   ├── quote-bulletin/          # Boletim de cotações
│   │   ├── news-bulletin/           # Boletim de notícias
│   │   ├── pix-payment/             # QR code Pix
│   │   └── boleto-payment/          # Link do boleto
│   └── lib/
│       ├── auth.ts
│       ├── email.ts           # Funções de envio (9 templates de assinatura)
│       ├── mercadopago.ts     # SDK MP: criar pagamento, webhook, consulta
│       ├── password.ts
│       └── scraper.ts         # Scraper com full-content + tags extraction
├── drizzle.config.ts
├── next.config.ts
└── biome.json
```

---

## Banco de Dados — Schema

| Tabela              | Descrição                                                    |
|---------------------|--------------------------------------------------------------|
| `users`             | Usuários do sistema (auth)                                   |
| `refresh_tokens`    | Tokens de refresh JWT vinculados ao usuário                  |
| `products`          | Produtos cotados (soja, milho, boi gordo, etc.)              |
| `regions`           | Regiões de referência (MS, SP, PR...)                        |
| `sources`           | Fontes de scraping com prioridade e flag de ativo/inativo    |
| `quotes`            | Cotações coletadas (preço, variação, data, produto, região)  |
| `scraper_logs`      | Log de cada execução do scraper (status, qtd inserida, erro) |
| `news_articles`     | Notícias com conteúdo completo (`content` HTML)              |
| `tags`              | Tags/categorias (nome único + slug)                          |
| `news_article_tags` | Tabela de junção notícias ↔ tags                             |
| `contact_messages`  | Mensagens enviadas pelo formulário de contato                |
| `subscription_plans`| Planos de assinatura (Bronze, Prata, Ouro) com preços e benefícios |
| `subscriptions`     | Assinatura do usuário (status, período, MP IDs, admin-granted) |
| `payments`          | Histórico de pagamentos (MP ID, status, método, Pix/boleto)  |
| `subscription_alert_settings` | Configuração de alertas de pagamento (admin)         |
| `subscription_alerts` | Log de alertas enviados por assinatura                     |
| `user_quote_subscriptions` | Cotações acompanhadas pelo usuário (boletins)         |

---

## Autenticação

Sistema baseado em JWT com dois tokens:

- **Access token** — curta duração (~15 min), enviado no header `Authorization: Bearer <token>`
- **Refresh token** — longa duração (7–30 dias), armazenado na tabela `refresh_tokens`, usado para renovar o access token

---

## Scraping

### Fontes de Cotações

| Prioridade | Slug                | URL Base                                                  | Dados            |
|------------|---------------------|-----------------------------------------------------------|------------------|
| 1          | `scotconsultoria`   | `https://www.scotconsultoria.com.br/cotacoes/`            | Pecuária         |
| 2          | `noticiasagricolas` | `https://www.noticiasagricolas.com.br/cotacoes/`          | Grãos            |

> O scraper constrói URLs dinamicamente por produto/estado a partir da URL base. A tabela `sources` armazena a URL geral.

### Preços Internacionais (CBOT)

| Símbolo | Commodity  | Bolsa |
|---------|-----------|-------|
| ZS=F    | Soja      | CBOT  |
| ZC=F    | Milho     | CBOT  |
| LE=F    | Boi Gordo | CBOT  |

Dados obtidos via Yahoo Finance API (gratuita), atualizados a cada 60 segundos via Socket.IO.

### Notícias

- Scraping busca notícias, baixa o conteúdo completo e extrai tags (meta keywords, elements de tag)
- Se nenhuma tag é encontrada, gera automaticamente a partir do título
- Deduplicação por constraint `UNIQUE` em `sourceUrl`
- Agendamento: 2x/dia via `agrocomm-scraper.timer`

### Agendamento (systemd)

O scraper roda via `agrocomm-scraper.timer` + `agrocomm-scraper.service`:

```bash
systemctl status agrocomm-scraper.timer
journalctl -u agrocomm-scraper.service -n 50
```

Os boletins e alertas de assinatura rodam via `agrocomm-bulletins.timer` + `agrocomm-bulletins.service` (07:00 e 17:00, dias úteis):

```bash
systemctl status agrocomm-bulletins.timer
journalctl -u agrocomm-bulletins.service -n 50
```

---

## Deploy

### Pré-requisitos na VPS

1. Ansible instalado localmente
2. Editar `ansible/inventory.ini` com o IP da VPS
3. Chave SSH configurada

### Provisionar VPS (primeira vez)

```bash
./scripts/ansible.sh
# Modo dry-run (sem alterações):
./scripts/ansible.sh --check
```

### Deploy de nova versão

```bash
# Na VPS, dentro de /var/www/agrocomm:
./scripts/deploy.sh
```

O script:
1. Copia o projeto para `/tmp/agrocomm`
2. Instala dependências e faz o build
3. Para o serviço, substitui o diretório e reinicia

---

## Variáveis de Ambiente

| Variável                       | Descrição                          | Exemplo                  |
|--------------------------------|------------------------------------|--------------------------|
| `DB_FILE_NAME`                 | Caminho para o arquivo SQLite      | `./drizzle/agrocomm.db`  |
| `JWT_SECRET`                   | Segredo para assinar os JWTs       | string aleatória longa   |
| `SMTP_HOST`                    | Servidor SMTP para emails          | `smtp.gmail.com`         |
| `SMTP_PORT`                    | Porta SMTP                         | `587`                    |
| `SMTP_USER`                    | Usuário de autenticação SMTP       | `user@gmail.com`         |
| `SMTP_PASS`                    | Senha de autenticação SMTP         | `app-password`           |
| `SMTP_SECURE`                  | Usar TLS                           | `true`                   |
| `CONTACT_EMAIL`                | Email destinatário do contato      | `contato@agrocomm.com`   |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`| Google Analytics Measurement ID    | `G-XXXXXXXXXX`           |
| `MERCADOPAGO_ACCESS_TOKEN`     | Access Token do Mercado Pago       | `APP_USR-...`            |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Public Key do MP (exposta no client) | `APP_USR-...`      |

Arquivo `.env` na raiz; em produção é copiado como `.env.production`.

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev

# Banco de dados
pnpm drizzle-kit push    # Aplica o schema no SQLite (NUNCA usar migrate)
pnpm db:seed             # Insere dados de exemplo
pnpm db:scrape           # Executa o scraper manualmente

# Deploy
pnpm build
pnpm start               # Porta 4000

# Linter/formatter
pnpm lint
pnpm format
```

---

## Guia para o Copilot

### Convenções do projeto

- **App Router** do Next.js 16 — use `app/` para rotas, `components/` para componentes reutilizáveis.
- Componentes de servidor por padrão; use `"use client"` apenas quando necessário (estado, eventos).
- **Drizzle ORM** com SQLite/libSQL — queries tipadas, sem SQL raw sempre que possível.
- **Nunca usar `drizzle-kit migrate`** — sempre `pnpm drizzle-kit push`.
- Estilização com **Tailwind CSS v4** — sem CSS Modules; classes utilitárias diretas.
- **Biome** para lint e format — não usar ESLint/Prettier.
- **pnpm** como gerenciador de pacotes — nunca npm ou yarn.
- Arquivos TypeScript (`.ts`/`.tsx`) em todo o projeto.

### Padrões de código

- **Nunca usar o tipo `any`** — nem como anotação, asserção (`as any`) ou parâmetro genérico. Use tipos adequados, `unknown`, generics ou type narrowing.
- Biome impõe `noExplicitAny: "error"` — qualquer uso de `any` falhará no lint.
- Exports default em componentes/páginas; named exports em funções utilitárias.
- Tipagem explícita apenas quando o TypeScript não consegue inferir.
- Sem comentários óbvios; comentar apenas lógicas complexas.
- Tratar erros na borda do sistema (API routes, scraper) — componentes internos podem assumir dados válidos.

### Onde adicionar cada coisa

| O que                    | Onde                                         |
|--------------------------|----------------------------------------------|
| Nova rota/página         | `src/app/<rota>/page.tsx`                    |
| API endpoint             | `src/app/api/<rota>/route.ts`                |
| Componente reutilizável  | `src/components/`                            |
| Server action            | `src/actions/<domínio>.ts`                   |
| Lógica de banco          | `src/db/`                                    |
| Constantes globais       | `src/config.ts`                              |
| Rota paralela (modal)    | `src/app/@modal/(.)<rota>/page.tsx`          |
| Template de email        | `src/emails/<nome>/html.pug` + `text.pug`   |
| Funções de email         | `src/lib/email.ts`                           |
| Tipos globais            | `src/types.ts` (criar se precisar)           |

---

_Documentação gerada automaticamente — atualize conforme o projeto evolui._

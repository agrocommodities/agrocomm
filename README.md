# AgroComm — Documentação do Projeto

## Visão Geral

Site de cotações de commodities agropecuárias (grãos e pecuária) para o mercado brasileiro. Coleta dados via scraping de múltiplas fontes, armazena em SQLite e os exibe em gráficos e tabelas.

- **Domínio:** agrocomm.com.br
- **Stack:** Next.js 16.1.6 (App Router + TypeScript), Drizzle ORM, SQLite, pnpm
- **Node.js:** v24.14.0 (gerenciado via fnm)
- **Servidor:** VPS Rocky Linux 9, Nginx (proxy reverso), systemd

---

## Estrutura de Pastas

```
agrocomm/
├── ansible/                   # Provisionamento da VPS
│   ├── inventory.ini          # Hosts Ansible
│   ├── playbook.yml           # Playbook principal
│   └── files/
│       ├── nginx/
│       │   └── agrocomm.conf  # Config Nginx (proxy + SSL)
│       └── systemd/
│           ├── agrocomm.service          # Serviço Next.js
│           ├── agrocomm-scraper.service  # Serviço oneshot do scraper
│           └── agrocomm-scraper.timer    # Timer (6x/dia, seg–sex)
├── drizzle/                   # Migrações geradas pelo drizzle-kit
├── scripts/
│   ├── ansible.sh             # Executa o playbook Ansible
│   └── deploy.sh              # Deploy manual na VPS
├── src/
│   ├── config.ts              # Links de navegação
│   ├── app/                   # App Router Next.js
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       └── health/route.ts
│   ├── components/
│   │   ├── Header.tsx         # Header com menu responsivo
│   │   ├── Navbar.tsx         # (legado — lógica migrada para Header)
│   │   └── Footer.tsx
│   └── db/
│       ├── index.ts           # Instância do Drizzle
│       ├── schema.ts          # Tabelas do banco
│       ├── seed.ts            # Seed de dados iniciais
│       └── scrape.ts          # Scraper de cotações
├── drizzle.config.ts
├── next.config.ts
└── biome.json                 # Linter/formatter
```

---

## Banco de Dados — Schema

| Tabela          | Descrição                                                    |
|-----------------|--------------------------------------------------------------|
| `users`         | Usuários do sistema (auth)                                   |
| `refresh_tokens`| Tokens de refresh JWT vinculados ao usuário                  |
| `products`      | Produtos cotados (soja, milho, boi gordo, etc.)              |
| `regions`       | Regiões de referência (MS, SP, PR…)                         |
| `sources`       | Fontes de scraping com prioridade e flag de ativo/inativo    |
| `quotes`        | Cotações coletadas (preço, variação, data, produto, região)  |
| `scraper_logs`  | Log de cada execução do scraper (status, qtd inserida, erro) |

---

## Autenticação

Sistema baseado em JWT com dois tokens:

- **Access token** — curta duração (~15 min), enviado no header `Authorization: Bearer <token>`
- **Refresh token** — longa duração (7–30 dias), armazenado na tabela `refresh_tokens`, usado para renovar o access token

> Ainda a implementar: rotas `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`

---

## Scraping

### Fontes (por prioridade)

| Prioridade | Slug                | URL                                                                       |
|------------|---------------------|---------------------------------------------------------------------------|
| 1          | `scotconsultoria`   | https://www.scotconsultoria.com.br/cotacoes/?ref=mnp                      |
| 2          | `noticiasagricolas` | https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-ms |
| 3          | `agrolink`          | https://www.agrolink.com.br/cotacoes/graos/soja                           |

- Se a fonte de maior prioridade falhar, a tabela `scraper_logs` registra o erro e o próximo source é tentado.
- Cotações duplicadas (mesmo produto + região + fonte + data) são ignoradas.
- Feriados nacionais fixos e fins de semana são ignorados automaticamente.

### Agendamento (systemd)

O scraper roda via `agrocomm-scraper.timer` + `agrocomm-scraper.service`:

- Segunda a sexta-feira
- Horários: 06:00, 08:30, 11:00, 13:30, 16:00, 18:00

Verificar status:
```bash
systemctl status agrocomm-scraper.timer
journalctl -u agrocomm-scraper.service -n 50
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

| Variável       | Descrição                     | Exemplo                  |
|----------------|-------------------------------|--------------------------|
| `DB_FILE_NAME` | Caminho para o arquivo SQLite | `./drizzle/agrocomm.db`  |
| `JWT_SECRET`   | Segredo para assinar os JWTs  | string aleatória longa   |

Arquivo `.env` na raiz; em produção é copiado como `.env.production`.

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev

# Banco de dados
pnpm db:push      # Aplica o schema no SQLite
pnpm db:seed      # Insere dados de exemplo
pnpm db:scrape    # Executa o scraper manualmente

# Deploy
pnpm build
pnpm start        # Porta 4000

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
- Estilização com **Tailwind CSS v4** — sem CSS Modules; classes utilitárias diretas.
- **Biome** para lint e format — não usar ESLint/Prettier.
- **pnpm** como gerenciador de pacotes — nunca npm ou yarn.
- Arquivos TypeScript (`.ts`/`.tsx`) em todo o projeto.

### Padrões de código

- Exports default em componentes/páginas; named exports em funções utilitárias.
- Tipagem explícita apenas quando o TypeScript não consegue inferir.
- Sem comentários óbvios; comentar apenas lógicas complexas.
- Tratar erros na borda do sistema (API routes, scraper) — componentes internos podem assumir dados válidos.

### Onde adicionar cada coisa

| O que                    | Onde                               |
|--------------------------|------------------------------------|
| Nova rota/página         | `src/app/<rota>/page.tsx`          |
| API endpoint             | `src/app/api/<rota>/route.ts`      |
| Componente reutilizável  | `src/components/`                  |
| Lógica de banco          | `src/db/`                          |
| Constantes globais       | `src/config.ts`                    |
| Tipos globais            | `src/types.ts` (criar se precisar) |

---

_Documentação gerada automaticamente — atualize conforme o projeto evolui._
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

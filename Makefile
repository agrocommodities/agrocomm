# Makefile — comandos de conveniência para o ambiente Docker
# Uso: make <target>   (execute na raiz do repositório)

COMPOSE = docker compose -f docker/docker-compose.yml --env-file docker/.env

.PHONY: help up down build build-app restart logs \
        ssl setup \
        db-shell db-reset \
        app-shell app-restart nginx-shell \
        scrape scrape-logs \
        ps

# ── Ajuda ────────────────────────────────────────────────────────────────────

help: ## Mostra esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup inicial ────────────────────────────────────────────────────────────

setup: ## Configura tudo do zero (certs + .env + build + up)
	@echo "⚙️  Setup inicial..."
	@[ -f docker/.env ] || cp docker/.env.example docker/.env && echo "  → docker/.env criado (edite as variáveis)"
	@bash docker/certs/generate.sh
	@$(MAKE) build
	@$(MAKE) up
	@echo ""
	@echo "✅ Ambiente disponível em https://agrocomm.local"

ssl: ## Gera certificados TLS locais (simula Let's Encrypt)
	bash docker/certs/generate.sh

# ── Ciclo de vida ────────────────────────────────────────────────────────────

up: ## Sobe todos os serviços em background
	$(COMPOSE) up -d

down: ## Para e remove todos os containers
	$(COMPOSE) down

build: ## Reconstrói todas as imagens
	$(COMPOSE) build

build-app: ## Reconstrói apenas a imagem do app e reinicia o container
	$(COMPOSE) build app
	$(COMPOSE) up -d --no-deps app

restart: ## Reinicia todos os serviços
	$(COMPOSE) restart

ps: ## Lista containers em execução
	$(COMPOSE) ps

# ── Logs ─────────────────────────────────────────────────────────────────────

logs: ## Logs de todos os serviços (segue)
	$(COMPOSE) logs -f

logs-app: ## Logs do container app
	$(COMPOSE) logs -f app

logs-media: ## Logs do container media
	$(COMPOSE) logs -f media

logs-nginx: ## Logs do container nginx
	$(COMPOSE) logs -f nginx

# ── Banco de dados ────────────────────────────────────────────────────────────

db-shell: ## Abre sqlite3 no container app
	$(COMPOSE) exec app sqlite3 /app/drizzle/agrocomm.db

db-reset: ## Reseta o banco SQLite (DESTRUTIVO)
	@echo "⚠️  Isso apagará todos os dados do SQLite local."
	@read -p "Confirmar? [s/N] " confirm && [ "$$confirm" = "s" ]
	$(COMPOSE) exec app pnpm reset
	@echo "🗄️  Banco recriado."

# ── Shells ────────────────────────────────────────────────────────────────────

app-shell: ## Shell no container app
	$(COMPOSE) exec app sh

nginx-shell: ## Shell no container nginx
	$(COMPOSE) exec nginx sh

# ── Restart individual ────────────────────────────────────────────────────────

app-restart: ## Reinicia apenas o container app
	$(COMPOSE) restart app

nginx-restart: ## Reinicia apenas o container nginx
	$(COMPOSE) restart nginx

# ── Scraper ───────────────────────────────────────────────────────────────────

scrape: ## Executa o scraper uma vez (one-shot) e aguarda conclusão
	$(COMPOSE) run --rm scraper

scrape-logs: ## Exibe os logs do último container scraper
	$(COMPOSE) logs scraper

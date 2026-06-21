list: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*##' Makefile | sed 's/:.*## /\t/'

install: ## Install dependencies
	task install

dev: ## Start development server
	task dev

build: ## Production build
	task build

preview: ## Preview production build
	task preview

typecheck: ## TypeScript type check
	task typecheck

lint: ## Linter
	task lint

format: ## Format code
	task format

test: ## Unit tests
	task test

test-e2e: ## E2E tests
	task test:e2e

deploy: ## Deploy to Cloudflare Workers
	task deploy

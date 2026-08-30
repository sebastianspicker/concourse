.PHONY: ci verify lint typecheck test build gitleaks

SHELL := /bin/bash

ci:
	./scripts/ci-local.sh

verify:
	SKIP_INSTALL=1 ./scripts/verify-production-ready.sh

lint:
	pnpm lint

typecheck:
	pnpm typecheck

test:
	pnpm test

build:
	pnpm build

gitleaks:
	docker run --rm -v "$(PWD):/repo" ghcr.io/gitleaks/gitleaks:v8.28.0 detect --redact --source=/repo --config=/repo/.gitleaks.toml

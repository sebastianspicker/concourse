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
	docker run --rm -v "$(PWD):/repo" zricethezav/gitleaks:latest detect --source=/repo --config=/repo/.gitleaks.toml

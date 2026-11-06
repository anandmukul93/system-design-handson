CH ?=
.PHONY: test test-all up down

test:            ## make test CH=04
	@d=$$(ls -d $(CH)-*/ 2>/dev/null | head -1); \
	if [ -z "$$d" ]; then echo "usage: make test CH=04"; exit 1; fi; \
	pytest $$d

test-all:
	pytest

up:
	docker compose -f infra/docker-compose.yml up -d

down:
	docker compose -f infra/docker-compose.yml down

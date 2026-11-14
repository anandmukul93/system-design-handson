CH ?=
PORT ?= 8000
.PHONY: test test-all up down site site-data

test:            ## make test CH=04
	@d=$$(ls -d $(CH)-*/ 2>/dev/null | head -1); \
	if [ -z "$$d" ]; then echo "usage: make test CH=04"; exit 1; fi; \
	pytest $$d

test-all:
	pytest

site-data:       ## regenerate site/data/site.json and COVERAGE.md, check all 111 concepts are mapped
	python tools/build_site_data.py

site: site-data  ## serve the showcase site at http://localhost:$(PORT)/site/
	python -m http.server $(PORT)

up:
	docker compose -f infra/docker-compose.yml up -d

down:
	docker compose -f infra/docker-compose.yml down

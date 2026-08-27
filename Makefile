# Arena — convenience targets. See README.md for the full story.

.PHONY: help infra setup seed dev-api dev-web test up down clean

help:
	@echo "Arena make targets:"
	@echo "  make infra    - start postgres + redis (docker)"
	@echo "  make setup    - install deps, run migrations, seed a live arena"
	@echo "  make dev-api  - run backend API + inline engine (:4000)"
	@echo "  make dev-web  - run frontend dev server (:5173)"
	@echo "  make test     - run backend tests"
	@echo "  make up       - full stack in docker (:8080 web, :4000 api)"
	@echo "  make down     - stop docker services"

infra:
	docker compose up -d postgres redis

setup: infra
	cd backend && npm install && npx prisma migrate deploy && npm run seed
	cd frontend && npm install

seed:
	cd backend && npm run seed

dev-api:
	cd backend && npm run dev

dev-web:
	cd frontend && npm run dev

test:
	cd backend && npm test

up:
	docker compose --profile full up --build

down:
	docker compose down

clean:
	docker compose down -v

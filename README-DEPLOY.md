# Deploy — recruit-martinelli

Este stack roda como Docker project **`recruit-martinelli`**. Os containers mantêm o prefixo legado `hr_` (`hr_api`, `hr_worker`, `hr_postgres`, `hr_redis`, `hr_web`, opcional `hr_mailhog` em profile `dev`) porque o repo veio do projeto original *hr-platform* — só o nome do project Docker foi alinhado ao repo atual.

## Operação

Daqui pra frente o `-p` é dispensável (o project name = nome do diretório). Mas pode ser explícito:

```bash
cd /app/recruit-martinelli
docker compose ps
docker compose logs -f api
docker compose up -d --build
docker compose down               # CUIDADO: derruba o stack
```

## Volumes (declarados como external no compose)

Para preservar os dados originais do antigo project `hr-platform`, os volumes em `docker-compose.yml` estão declarados como `external: true` com os nomes legados:

| Service | Volume nome real | Conteúdo |
|---|---|---|
| postgres | `hr-platform_postgres_data` | dados do Postgres (~47 MB) |
| redis | `hr-platform_redis_data` | persistência Redis |
| api / worker | `hr-platform_api_uploads` | uploads da API |

Se algum dia for desejável padronizar para `recruit-martinelli_*`, é uma migração à parte (parar stack → `docker run -v old:/from -v new:/to alpine cp -a /from/. /to/` → trocar compose → subir).

## Portas publicadas

- API (uvicorn): `8313 → 8000`
- Web (Next.js dev): `3313 → 3000`
- Postgres: `127.0.0.1:5432 → 5432`
- Redis: `127.0.0.1:6379 → 6379`
- Mailhog (profile `dev`): `1025`, `8025`

## Histórico

- 2026-05-25: rename do project `hr-platform → recruit-martinelli`. Volumes preservados via `external: true`. Removido o symlink `/app/hr-platform`.

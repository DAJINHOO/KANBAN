# Arquitetura — Kanban Colaborativo

## Visão geral

Aplicação monolítica modular que serve, na MESMA porta:
- API REST em `/api`
- Documentação OpenAPI em `/docs`
- WebSocket (Socket.IO) em `/socket.io`
- Frontend SPA compilado em `/`
- Healthcheck em `/health`

## Camadas

| Camada | Responsabilidade | Não depende de |
|--------|------------------|----------------|
| `domain` | Entidades + interfaces de repositório | HTTP, ORM, Socket.IO |
| `application` | Serviços (casos de uso), regras de negócio | Express, Prisma |
| `adapters/http` | Controllers, rotas, middlewares | Prisma (só via serviços) |
| `adapters/websocket` | Socket.IO, salas, validação de eventos | Prisma (só via serviços) |
| `persistence` | Implementações Prisma dos repositórios | Express, Socket.IO |

## Padrões de projeto

1. **Repository** — cada agregado tem uma interface em `domain/repositories` e uma implementação em `persistence/repositories`. O domínio nunca importa Prisma.
2. **Dependency Injection** — `config/container.js` monta o grafo (repositórios → serviços). Trocar implementação = 1 linha.
3. **Service Layer** — controllers e handlers de socket são finos; regra de negócio vive em `application/services`.
4. **Observer (Socket.IO)** — `io.to(room).emit(...)` desacopla quem emite de quem escuta.

## Persistência

7 tabelas: `User`, `Project`, `ProjectMember`, `Column`, `Card`, `Comment`, `CardHistory`.
Relações: 1:N (projeto→colunas, coluna→cartões, cartão→comentários, cartão→histórico), N:N via `ProjectMember`.

Migrations versionadas com Prisma. Seed cria 2 usuários, 1 projeto, 3 colunas, 2 cartões.

**Operação transacional:** `PrismaCardRepository.move()` usa `prisma.$transaction` para reordenar origem, reordenar destino, mover o cartão e gravar o histórico — tudo ou nada.

## WebSockets

Servidor Socket.IO montado sobre o mesmo `http.Server` do Express.

### Salas
- `project:{projectId}` — todos os participantes do quadro.
- `user:{userId}` (via `socket.userId`) — usado para filtrar quem originou o evento.

### Eventos

| Cliente → Servidor | Servidor → Cliente | Descrição |
|--------------------|--------------------|-----------|
| `board:join` | `board:state` | Entrar na sala + receber estado completo |
| `board:leave` | `presence:update` | Sair e atualizar presença |
| `card:move` | `card:moved` | Reordenação sincronizada para todos |
| `card:editing-start` | `card:editing` | Indicador "quem está editando" |
| `card:editing-stop` | `card:editing-stop` | Libera o indicador |
| `comment:create` | `comment:new` + `notification` | Comentário em tempo real |

### Validação
Todo payload é validado com Zod **no servidor**. Payload inválido → `socket.emit('error', ...)` para o remetente, sem broadcast.

### Conexão / reconexão
- `connectionStateRecovery` do Socket.IO restaura a sessão por 2 min.
- No cliente, `reconnect` reemite `board:join` (o estado é reconstruído via `board:state`).
- Ao desconectar, o servidor limpa `card:editing` pendente do usuário.

## Containerização

- Multi-stage: build (com devDeps + Prisma generate) → runtime enxuto.
- Usuário `app` sem privilégios.
- `HEALTHCHECK` do Docker consulta `/health`.
- `docker-compose` sobe `db` (Postgres com volume `pgdata` + `pg_isready`) e `app` com `depends_on.condition=service_healthy`.
- Migrations e seed executáveis por `docker compose exec app ...`.
- Configuração 100% via variáveis de ambiente; `.env.example` versionado, `.env` no `.gitignore`.
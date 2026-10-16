cd ~/Documentos/"projeto node"/"PROJETO SALA DE AULA VIRUTAL KANBAN"/KANBAN

cat > README.md <<'EOF'
# Kanban Colaborativo Escolar

Quadro Kanban colaborativo em tempo real. Alunos se identificam por nome, criam ou entram em quadros, movem cartões, comentam e veem as mudanças refletidas instantaneamente para todos os participantes conectados.

**Trabalho 4 — API REST + WebSockets + ORM + Docker**

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js 20 + Express |
| Real-time | Socket.IO |
| ORM | Prisma |
| Banco | PostgreSQL 16 |
| Validação | Zod |
| Docs | Swagger (OpenAPI 3.0) |
| Frontend | React 18 + Vite |
| Container | Docker + docker-compose |

---

## Como Rodar

Pré-requisitos: **Docker** e **Docker Compose** instalados.

```bash
# 1. Clonar
git clone <url-do-repo>
cd KANBAN

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Subir tudo
docker compose up -d --build

# 4. Aplicar migrations
docker compose exec app npx prisma migrate deploy

# 5. Popular o banco com dados de exemplo
docker compose exec app npm run prisma:seed


Acesse:
URL	Descrição
http://localhost:3000	Interface do Kanban
http://localhost:3000/docs	Documentação OpenAPI (Swagger UI)
http://localhost:3000/health	Healthcheck (usado pelo Docker)
http://localhost:3000/api	Base da API REST

    Se a porta 3000 ou 5432 já estiver em uso, ajuste PORT e DB_PORT no .env antes de subir.

Como Usar

    Abra http://localhost:3000

    Digite seu nome (mínimo 2 caracteres)

    Clique em Criar para um novo quadro, ou clique em um quadro existente para entrar

    Você verá 3 colunas: A Fazer, Em Progresso, Concluído

    Arraste cartões entre colunas

    Clique em + em uma coluna para criar cartão

    Clique em um cartão para ver e adicionar comentários

Para testar o tempo real: abra a mesma URL em duas abas (ou dois navegadores) e entre no mesmo quadro. Mover um cartão em uma aba reflete na outra em milissegundos. O indicador laranja "Alguém editando" aparece quando outro usuário está com o cartão aberto.
API REST

Todos os endpoints retornam JSON. Erros seguem formato padronizado:
json

{
  "error": {
    "status": 400,
    "message": "Dados inválidos",
    "details": [
      { "field": "name", "message": "Required", "code": "invalid_type" }
    ]
  },
  "timestamp": "2026-10-16T02:22:27.244Z"
}

Endpoints

Users
text

POST   /api/users                  Cria/identifica usuário { name }
GET    /api/users                  Lista paginada (?page&limit&name)
GET    /api/users/:id              Busca por id
PUT    /api/users/:id              Renomeia { name }
DELETE /api/users/:id              Remove

Projects
text

POST   /api/projects               Cria projeto + colunas padrão { name, description?, ownerId }
GET    /api/projects               Lista paginada (?page&limit&name)
GET    /api/projects/:id/board     Quadro completo (colunas + cartões + membros)
POST   /api/projects/:id/join      Adiciona usuário como membro { userId }
PUT    /api/projects/:id           Atualiza projeto
DELETE /api/projects/:id           Remove

Cards
text

GET    /api/cards                  Lista paginada (?page&limit&projectId&columnId&assigneeId&title)
POST   /api/cards                  Cria cartão { title, columnId, projectId, userId }
GET    /api/cards/:id              Busca por id
PUT    /api/cards/:id              Atualiza { title?, description?, userId }
DELETE /api/cards/:id              Remove
POST   /api/cards/:id/move         Move transacionalmente { toColumnId, toPosition, userId }

Comments
text

POST   /api/cards/:cardId/comments               Cria { content, userId }
GET    /api/cards/:cardId/comments               Lista do cartão
GET    /api/cards/:cardId/comments/:id           Busca por id
PUT    /api/cards/:cardId/comments/:id           Edita { content, userId }
DELETE /api/cards/:cardId/comments/:id           Remove { userId }

Exemplos com curl
bash

# Criar usuário
USER=$(curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana"}')
USER_ID=$(echo $USER | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

# Criar projeto
PROJ=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Meu Quadro\",\"ownerId\":\"$USER_ID\"}")
PROJ_ID=$(echo $PROJ | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

# Ver o quadro
curl -s http://localhost:3000/api/projects/$PROJ_ID/board | python3 -m json.tool

# Listar cartões do projeto
curl -s "http://localhost:3000/api/cards?projectId=$PROJ_ID" | python3 -m json.tool

WebSockets — Eventos

Servidor Socket.IO na mesma porta do HTTP.
Cliente → Servidor
Evento	Payload	Efeito
board:join	{ projectId, userId }	Entra na sala, recebe board:state
board:leave	—	Sai da sala
card:move	{ cardId, toColumnId, toPosition }	Move cartão, emite para todos
card:editing-start	{ cardId, projectId }	Marca "editando"
card:editing-stop	{ cardId, projectId }	Libera
comment:create	{ cardId, content }	Cria comentário
Servidor → Cliente
Evento	Quando
board:state	Após board:join
card:moved	Alguém moveu um cartão
card:created	Alguém criou cartão
card:deleted	Alguém removeu cartão
card:editing	Alguém começou a editar
card:editing-stop	Alguém parou de editar
comment:new	Novo comentário
comment:updated	Comentário editado
comment:deleted	Comentário removido
notification	Mensagem amigável (nova atividade)
presence:update	Lista de usuários online
error	Payload inválido no evento enviado
Estrutura
text

KANBAN/
├── backend/
│   ├── src/
│   │   ├── domain/            # Entidades + interfaces de repositório (sem infra)
│   │   ├── application/       # Services (regras de negócio)
│   │   ├── adapters/
│   │   │   ├── http/          # Controllers, rotas, middlewares
│   │   │   └── websocket/     # Socket.IO, salas, handlers
│   │   ├── persistence/       # Implementações Prisma
│   │   ├── config/            # env, container (DI), swagger
│   │   └── server.js
│   ├── prisma/                # schema, migrations, seed
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/             # Login, Boards, Board
│   │   ├── services/          # api.js, socket.js
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── ARQUITETURA.md
└── README.md

Comandos Úteis
bash

# Ver logs em tempo real
docker compose logs -f app

# Reiniciar o app sem rebuild
docker compose restart app

# Entrar no container
docker compose exec app sh

# Rodar migrations novamente
docker compose exec app npx prisma migrate deploy

# Rodar seed novamente
docker compose exec app npm run prisma:seed

# Abrir Prisma Studio (interface visual do banco)
docker compose exec app npx prisma studio
# acesse http://localhost:5555

# Parar tudo (mantém dados)
docker compose down

# Parar tudo e apagar dados do banco
docker compose down -v

# Rebuild completo do zero
docker compose down --rmi local -v
docker builder prune -af
docker compose up -d --build

Variáveis de Ambiente

Definidas em .env (copie de .env.example):
Variável	Descrição	Default
DB_USER	Usuário do Postgres	kanban
DB_PASSWORD	Senha do Postgres	kanban_dev_pwd
DB_NAME	Nome do banco	kanban
DB_PORT	Porta do Postgres no host	5433
PORT	Porta da aplicação no host	3000
NODE_ENV	Ambiente	production

    O .env nunca vai para o Git (está no .gitignore). O .env.example é versionado.

Requisitos Atendidos

     API REST com 4 recursos e CRUD completo (Users, Projects, Cards, Comments)

     OpenAPI acessível em /docs

     Validação com Zod e tratamento padronizado de erros

     Paginação e filtros em todas as listagens

     PostgreSQL acessado via Prisma ORM

     7 tabelas com relacionamentos

     Migrations versionadas + seed

     Operação transacional (movimentação de cartão)

     Clean Architecture em 4 camadas

     4 padrões de projeto: Repository, DI, Service Layer, Observer

     Domínio isolado da infraestrutura

     Socket.IO com 6+ eventos, salas, validação, reconexão

     Frontend responsivo com estados de loading e erro

     Dockerfile multi-stage sem privilégios + docker-compose com healthcheck

     Interface, API e WebSocket na mesma porta
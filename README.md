# 🚀 API de Gerenciamento de Tarefas

Uma API RESTful completa para gerenciamento de tarefas e equipes, desenvolvida com Node.js, TypeScript e PostgreSQL.

## 🛠️ Tecnologias Utilizadas

### Backend

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem de programação tipada
- **Express.js** - Framework web para Node.js
- **Prisma ORM** - ORM moderno para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação via tokens
- **bcrypt** - Criptografia de senhas
- **Zod** - Validação de schemas

### Desenvolvimento

- **Jest** - Framework de testes
- **Supertest** - Testes de integração
- **Docker Compose** - Containerização do banco de dados
- **TSX** - Executor TypeScript para desenvolvimento
- **TSUP** - Bundler para produção

## 📋 Funcionalidades

- ✅ **Autenticação e Autorização** - Login com JWT
- 👥 **Gestão de Usuários** - CRUD completo de usuários
- 🏢 **Gestão de Equipes** - Criação e gerenciamento de equipes
- 📝 **Gestão de Tarefas** - CRUD completo de tarefas
- 🔄 **Controle de Status** - Atualização de status das tarefas
- ⚡ **Controle de Prioridade** - Definição de prioridades
- 📊 **Histórico de Alterações** - Rastreamento de mudanças
- 🔐 **Controle de Acesso** - Roles de usuário (admin/member)

## 🚀 Como Usar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- Docker e Docker Compose
- npm ou yarn

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd Desafio-RocketSeat-API
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gerenciadorDeTarefas"
JWT_SECRET="sua-chave-secreta-aqui"
PORT=3333
```

### 4. Inicie o banco de dados

```bash
docker-compose up -d
```

### 5. Execute as migrações

```bash
npx prisma migrate dev
```

### 6. Inicie o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3333`

## 📚 Endpoints da API

### 🔐 Autenticação

#### POST `/sessions` - Login

```json
{
  "email": "usuario@email.com",
  "password": "123456"
}
```

**Resposta:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 👥 Usuários

#### POST `/users` - Criar usuário

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "123456"
}
```

### 🏢 Equipes

#### POST `/team` - Criar equipe

```json
{
  "name": "Equipe Frontend",
  "description": "Equipe responsável pelo desenvolvimento frontend"
}
```

#### GET `/team` - Listar equipes

#### POST `/team/:teamId/members` - Adicionar membro à equipe

```json
{
  "userId": "id-do-usuario"
}
```

### 📝 Tarefas

#### POST `/task` - Criar tarefa

```json
{
  "title": "Implementar login",
  "description": "Criar sistema de autenticação",
  "assigned_to": "id-do-usuario",
  "team_id": "id-da-equipe"
}
```

#### GET `/task` - Listar tarefas

#### PATCH `/task/:taskId/status` - Atualizar status

```json
{
  "status": "inProgress"
}
```

**Status disponíveis:** `pending`, `inProgress`, `completed`

#### PATCH `/task/:taskId/priority` - Atualizar prioridade

```json
{
  "priority": "high"
}
```

**Prioridades disponíveis:** `low`, `medium`, `high`

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **users** - Usuários do sistema
- **teams** - Equipes
- **teams_members** - Relacionamento usuário-equipe
- **task** - Tarefas
- **task_history** - Histórico de alterações das tarefas

### Enums

- **UserRole**: `admin`, `member`
- **Status**: `pending`, `inProgress`, `completed`
- **Priority**: `low`, `medium`, `high`

## 🧪 Testes

A API possui uma suíte completa de testes automatizados cobrindo:

### Tipos de Testes

- **Testes Unitários** - Testam funcionalidades específicas
- **Testes de Integração** - Testam fluxos completos da aplicação
- **Testes de Middleware** - Testam autenticação e autorização
- **Testes de Validação** - Testam validação de dados

### Arquivos de Teste

```
src/__tests__/
├── setup.ts              # Configuração e helpers dos testes
├── users.test.ts         # Testes de usuários
├── sessions.test.ts      # Testes de autenticação
├── teams.test.ts         # Testes de equipes
├── tasks.test.ts         # Testes de tarefas
├── middleware.test.ts    # Testes de middlewares
└── integration.test.ts   # Testes de integração
```

### Executando os Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:dev

# Executar testes com coverage
npm test -- --coverage

# Executar testes específicos
npm test -- users.test.ts
```

### Cobertura de Testes

Os testes cobrem:

- ✅ Criação, validação e autenticação de usuários
- ✅ Gestão completa de equipes (CRUD)
- ✅ Gestão completa de tarefas (CRUD)
- ✅ Atualização de status e prioridade
- ✅ Autenticação JWT e middlewares
- ✅ Validação de dados com Zod
- ✅ Tratamento de erros
- ✅ Fluxos completos de integração

## 📁 Estrutura do Projeto

```
src/
├── controllers/     # Controladores da aplicação
├── routes/         # Definição das rotas
├── middlewares/    # Middlewares (autenticação, validação)
├── database/       # Configurações do banco
├── config/         # Configurações gerais
├── types/          # Tipos TypeScript
├── utils/          # Utilitários
├── tests/      # Arquivos de teste
├── app.ts          # Configuração do Express
├── server.ts       # Inicialização do servidor
└── env.ts          # Validação de variáveis de ambiente
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm start` - Inicia o servidor em modo produção
- `npm test` - Executa todos os testes
- `npm run test:dev` - Executa os testes em modo watch

## 🚀 Deploy

Para fazer deploy em produção:

1. Configure as variáveis de ambiente
2. Execute `npm run build`
3. Inicie com `npm start`

## 📝 Exemplo de Uso com Insomnia

O projeto inclui um arquivo `Insomnia_2025-06-21.yaml` com todas as requisições configuradas para teste.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

---

Desenvolvido para o desafio da RocketSeat

# Pokemon API

API REST desenvolvida com Node.js 22 LTS, TypeScript e Express.

## Tecnologias

- **Node.js**: 22 LTS
- **TypeScript**: 5.9.3
- **Express**: 5.1.0
- **Helmet**: 8.1.0 (segurança)
- **Jest**: 30.2.0 (testes)
- **Biome**: 2.3.0 (linter + formatter)

## Requisitos

- Node.js 22 LTS
- npm ou yarn
- Docker e Docker Compose (opcional)

## Instalação

```bash
npm install
```

## Comandos Disponíveis

### Desenvolvimento
```bash
npm run dev
```
Inicia o servidor em modo watch com `tsx`.

### Build
```bash
npm run build
```
Compila o TypeScript para JavaScript na pasta `dist/`.

### Produção
```bash
npm start
```
Executa o servidor compilado a partir de `dist/`.

### Lint e Formatação

```bash
# Verificar problemas de lint e formato
npm run lint

# Formatar código automaticamente
npm run format

# Verificar e aplicar correções nos arquivos (usado pelo lint-staged)
npm run lint:staged
```

**Nota:** Este projeto usa **Biome** como linter e formatter único (não usa mais ESLint ou Prettier).

### Testes

# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:cov

# Executar testes no CI
npm run test:ci

## Docker

### Desenvolvimento
```bash
docker compose up --build
```

O servidor estará disponível em `http://localhost:3000`.

### Produção (Docker)
Para executar em modo produção, altere o `target` no `docker-compose.yml` de `dev` para `prod`.

## Testes

### Health Check
```bash
curl http://localhost:3000/healthz
```

Resposta esperada:
```json
{
  "status": "ok",
  "uptimeSeconds": 1.23,
  "version": "1.0.0"
}
```

## Estrutura do Projeto

```
pokemon-challenge-backend/
├── src/
│   └── main/
│       ├── config/
│       │   └── middlewares.ts
│       └── server.ts
├── dist/                 # Gerado após build
├── node_modules/         # Dependências
├── .dockerignore
├── .eslintrc.json
├── .gitignore
├── .nvmrc
├── docker-compose.yml
├── Dockerfile
├── package.json
├── README.md
└── tsconfig.json
```

## Qualidade de Código

Este projeto implementa uma esteira de qualidade moderna usando **Git hooks automatizados** via Husky:

### 🔍 Pre-commit Hook

Executado automaticamente antes de cada commit, roda **Biome** (linter + formatter) somente nos arquivos modificados via `lint-staged`:

- ✅ Corrige formatação automaticamente (indent 4 espaços, 100 colunas)
- ✅ Organiza imports automaticamente
- ✅ Aplica regras de lint TypeScript
- ❌ **Bloqueia o commit** se houver erros graves de lint não auto-corrigíveis

```bash
# O hook roda automaticamente, mas você pode executar manualmente:
npm run lint:staged
```

### 🚀 Pre-push Hook

Executado automaticamente antes de cada push, roda a **suite completa de testes com cobertura**:

- ✅ Executa todos os testes unitários
- ✅ Gera relatório de cobertura (mínimo 80%)
- ❌ **Bloqueia o push** se algum teste falhar ou cobertura < 80%

```bash
# O hook roda automaticamente, mas você pode executar manualmente:
npm run test:cov
```

### 📋 Ferramentas de Qualidade

- **Biome**: Linter + formatter único (substituiu completamente ESLint + Prettier)
- **Husky**: Gerenciador de Git hooks
- **lint-staged**: Executa comandos apenas em arquivos staged
- **Jest**: Framework de testes com cobertura de código

### 🎯 Runtime Alvo

- **Node.js 22 LTS** (CommonJS em produção)
- **TypeScript** em desenvolvimento via `tsx`
- **Clean Architecture** + **TDD** (estilo Rodrigo Manguinho)

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3000)
- `NODE_ENV`: Ambiente de execução (development/production/test)

## Licença

ISC

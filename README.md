# Pokemon API

API REST desenvolvida com Node.js 22 LTS, TypeScript e Express.

## Tecnologias

- **Node.js**: 22 LTS
- **TypeScript**: 5.9.3
- **Express**: 5.1.0
- **Helmet**: 8.1.0 (segurança)

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

### Lint
```bash
npm run lint
```
Executa o ESLint em todos os arquivos TypeScript.

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

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3000)
- `NODE_ENV`: Ambiente de execução (development/production)

## Licença

ISC

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

- **Node.js** 22 LTS
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (opcional)
- **Docker Engine:** 27.3.1 ou superior  
- **Docker Compose:** v2.29.1 ou superior

> 💡 Testado com Docker Engine `27.3.1` e Compose plugin `v2.29.1` no Ubuntu 22.04 LTS.


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

* Build sem cache

```bash
docker compose build --no-cache
```

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

## Documentação da API

Após subir o projeto localmente:

- Acesse `http://localhost:3000/healthz` para verificar saúde.
- Acesse `http://localhost:3000/docs` para visualizar e testar a documentação interativa (Swagger UI gerado a partir de OpenAPI 3.1).

O arquivo `docs/openapi.yaml` é o contrato da API. Ele descreve endpoints, payloads e respostas.

### Endpoints Disponíveis

#### POST /pokemons

Cria um novo pokémon.

**Request:**
```json
{
  "tipo": "pikachu",
  "treinador": "Ash"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "tipo": "pikachu",
  "treinador": "Ash",
  "nivel": 1
}
```

**Regras de Validação:**
- `tipo` é obrigatório e deve ser um dos valores: `"pikachu"`, `"charizard"`, ou `"mewtwo"`
- `treinador` é obrigatório e não pode ser string vazia
- `nivel` sempre inicia em 1 automaticamente e **não deve ser enviado** pelo cliente
- Se `nivel` for enviado no request, a API retornará erro 400

**Response (400 Bad Request):**
```json
{
  "error": "tipo must be one of: \"pikachu\", \"charizard\", \"mewtwo\""
}
```

#### GET /pokemons

Lista todos os pokémons cadastrados no sistema.

**Request:** Nenhum corpo ou parâmetro necessário.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "tipo": "pikachu",
    "treinador": "Thiago",
    "nivel": 1
  },
  {
    "id": 2,
    "tipo": "charizard",
    "treinador": "Renato",
    "nivel": 1
  }
]
```

**Response (200 OK) - Lista vazia:**
```json
[]
```

**Observações:**
- Retorna array vazio se não houver pokémons cadastrados
- Não há paginação implementada (retorna todos os registros)
- A ordem dos resultados é determinada pelo banco de dados

**⚠️ Arquitetura:**
Este endpoint segue o padrão de **Use Cases**:
- **Use Case (`domain/use-cases/list-pokemons.ts`)**: Encapsula a lógica de listar todos os pokémons
- **Controller (`application/controllers/list-pokemons.ts`)**: Orquestra a execução do use case
- **Factory**: Injeta o use case no controller

#### GET /pokemons/:id

Carrega os dados de um pokémon específico pelo ID.

**Request:** Nenhum corpo, apenas o ID na URL.

**Response (200 OK):**
```json
{
  "id": 1,
  "tipo": "pikachu",
  "treinador": "Ash",
  "nivel": 1
}
```

**Regras de Validação:**
- `id` é obrigatório na URL e deve ser um número válido inteiro
- IDs decimais, letras ou caracteres especiais retornam erro 400

**Response (400 Bad Request) - ID inválido:**
```json
{
  "error": "id must be a valid number"
}
```

**Response (404 Not Found) - Pokémon não encontrado:**
```json
{
  "error": "Pokemon not found"
}
```

**⚠️ Arquitetura:**
Este endpoint segue o padrão de **Use Cases**:
- **Use Case (`domain/use-cases/load-pokemon-by-id.ts`)**: Encapsula a lógica de buscar pokémon por ID
- **Controller (`application/controllers/load-pokemon-by-id.ts`)**: Orquestra a execução do use case e trata o caso de pokémon não encontrado (404)
- **Factory**: Injeta o use case no controller

#### PUT /pokemons/:id

Altera o treinador de um pokémon existente. **Apenas a propriedade `treinador` pode ser alterada.**

**Request:**
```json
{
  "treinador": "Thiago"
}
```

**Response (204 No Content):**
Sem corpo na resposta. Status 204 indica sucesso.

**Regras de Validação:**
- `id` é obrigatório na URL e deve ser um número válido
- `treinador` é obrigatório e não pode ser string vazia
- Apenas o campo `treinador` é permitido. Outros campos (como `tipo`, `nivel`) não podem ser alterados por este endpoint

**Response (400 Bad Request):**
```json
{
  "error": "The field treinador is required"
}
```

**Response (404 Not Found) - Pokémon não encontrado:**
```json
{
  "error": "Pokemon not found"
}
```

**⚠️ Arquitetura:**
Este endpoint segue o padrão de **Use Cases**:
- **Use Case (`domain/use-cases/update-pokemon-treinador.ts`)**: Contém a regra de negócio (verificar se pokémon existe antes de atualizar)
- **Controller (`application/controllers/update-pokemon-treinador.ts`)**: Orquestra a execução do use case
- **Factory**: Injeta o use case no controller

#### DELETE /pokemons/:id

Deleta um pokémon existente do banco de dados.

**Request:** Nenhum corpo, apenas o ID na URL.

**Response (204 No Content):**
Sem corpo na resposta. Status 204 indica sucesso.

**Regras de Validação:**
- `id` é obrigatório na URL e deve ser um número válido inteiro
- Pokémon deve existir no banco de dados

**Response (400 Bad Request) - ID inválido:**
```json
{
  "error": "id must be a valid number"
}
```

**Response (404 Not Found) - Pokémon não encontrado:**
```json
{
  "error": "Pokemon not found"
}
```

**⚠️ Arquitetura:**
Este endpoint segue o padrão de **Use Cases**:
- **Use Case (`domain/use-cases/delete-pokemon.ts`)**: Contém a regra de negócio (verificar se pokémon existe antes de deletar)
- **Controller (`application/controllers/delete-pokemon.ts`)**: Orquestra a execução do use case
- **Factory**: Injeta o use case no controller

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
- **Clean Architecture** + **TDD**

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3000)
- `NODE_ENV`: Ambiente de execução (development/production/test)

## Licença

ISC

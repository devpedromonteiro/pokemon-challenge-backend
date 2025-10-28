# Guia de Início Rápido - Camada de Banco de Dados

## 🚀 Configuração

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` no diretório raiz:

```env
# Configuração do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pokemon_db
```

### 2. Iniciar PostgreSQL

Usando Docker:

```bash
docker run -d \
  --name pokemon-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pokemon_db \
  -p 5432:5432 \
  postgres:17
```

Ou usando docker-compose (se você tiver um docker-compose.yml):

```bash
docker compose up -d db
```

### 3. Gerar e Executar Migrações

```bash
# Gerar arquivos de migração a partir do schema
npm run db:generate

# Enviar schema diretamente para o banco de dados (desenvolvimento)
npm run db:push
```

### 4. Iniciar a Aplicação

```bash
# Modo desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

## 📚 Uso Básico

### Usando Repositórios

```typescript
import { makePgPokemonRepository } from '@/main/factories/infra/repos/postgres';

// No seu use case ou controller
const repository = makePgPokemonRepository();

// Carregar um Pokémon
const pokemon = await repository.loadById(1);

// Criar um Pokémon
const created = await repository.create({
  tipo: "pikachu",
  treinador: "Ash"
});

// Listar todos os Pokémons
const all = await repository.listAll();

// Atualizar treinador
await repository.updateTreinador(1, "Gary");

// Deletar Pokémon
await repository.deleteById(1);
```

### Usando Transações

```typescript
import { makePgConnection } from '@/main/factories/infra/repos/postgres';
import { makePgPokemonRepository } from '@/main/factories/infra/repos/postgres';

const connection = makePgConnection();
const repository = makePgPokemonRepository();

try {
  await connection.openTransaction();
  
  await repository.create({ tipo: "pikachu", treinador: "Ash" });
  await repository.create({ tipo: "charizard", treinador: "Red" });
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.closeTransaction();
}
```

### Usando o Decorator de Transação

```typescript
import { DbTransactionController } from '@/application/decorators';
import { makePgConnection } from '@/main/factories/infra/repos/postgres';

// Assumindo que você tem um controller
class SavePokemonController {
  async handle(request: any) {
    // Sua lógica aqui
  }
}

// Envolva-o com suporte a transações
const controller = new SavePokemonController();
const transactionalController = new DbTransactionController(
  controller,
  makePgConnection()
);

// Todas as operações serão executadas em uma transação
await transactionalController.handle(request);
```

## 🧪 Testes

Executar testes:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:cov

# Executar testes de integração
npm run test:integration

# Executar todos os testes (unitários + integração)
npm run test:all
```

## 🛠️ Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Iniciar servidor de desenvolvimento com hot reload |
| `npm run build` | Build para produção |
| `npm start` | Iniciar servidor de produção |
| `npm test` | Executar testes unitários |
| `npm run test:watch` | Executar testes em modo watch |
| `npm run test:cov` | Executar testes com cobertura |
| `npm run test:integration` | Executar testes de integração |
| `npm run test:all` | Executar todos os testes |
| `npm run db:generate` | Gerar arquivos de migração do Drizzle |
| `npm run db:migrate` | Executar migrações do Drizzle |
| `npm run db:push` | Enviar schema para o banco (dev) |
| `npm run db:studio` | Abrir Drizzle Studio (GUI) |
| `npm run lint` | Executar linter Biome |
| `npm run format` | Formatar código com Biome |

## 📁 Estrutura do Projeto

```
src/
├── domain/
│   ├── contracts/repos/          # Interfaces de repositórios (contratos de domínio)
│   │   ├── pokemon-repository.ts
│   │   └── index.ts
│   ├── use-cases/                # Casos de uso (lógica de negócio)
│   │   ├── create-pokemon.ts
│   │   ├── battle-pokemon.ts
│   │   └── index.ts
│   └── battle/                   # Lógica pura de domínio
│       └── pick-winner-weighted.ts
├── application/
│   ├── controllers/              # Controllers (orquestração)
│   │   ├── pokemon/
│   │   │   ├── create-pokemon.ts
│   │   │   └── index.ts
│   │   └── battle/
│   │       ├── battle-pokemon.ts
│   │       └── index.ts
│   ├── validation/               # Validadores de entrada
│   │   ├── required.ts
│   │   └── index.ts
│   ├── contracts/
│   │   └── db-transaction.ts    # Interface de transação
│   └── decorators/
│       └── db-transaction-controller.ts
├── infra/
│   └── repos/postgres/           # Implementação PostgreSQL
│       ├── helpers/
│       │   ├── connection.ts    # Gerenciador de conexão Singleton
│       │   └── errors.ts
│       ├── schemas/
│       │   └── pokemon.ts       # Schemas do Drizzle
│       ├── pokemon-repository.ts # Implementação do repositório
│       └── repository.ts        # Classe base de repositório
└── main/
    ├── config/
    │   └── env.ts               # Configuração de ambiente
    ├── factories/
    │   └── infra/repos/postgres/ # Factories de repositórios
    ├── routes/                  # Rotas Express
    │   ├── pokemon.ts
    │   └── battle.ts
    └── server.ts                # Inicialização do servidor
```

## 🎯 Principais Funcionalidades

✅ **Clean Architecture** - Separação de responsabilidades com limites claros  
✅ **Princípios SOLID** - Inversão de dependência e segregação de interface  
✅ **Use Cases** - Lógica de negócio no domínio, controllers orquestram  
✅ **Segurança de Tipos** - Suporte completo ao TypeScript com Drizzle ORM  
✅ **Suporte a Transações** - Gerenciamento de transações integrado  
✅ **Padrão Singleton** - Pool de conexões eficiente  
✅ **Fácil Testar** - Interfaces amigáveis para mocks  
✅ **Alta Cobertura de Testes** - Suíte de testes abrangente  

## 🔧 Solução de Problemas

### Problemas de Conexão

Se você receber `ConnectionNotFoundError`:
- Certifique-se de que o PostgreSQL está rodando
- Verifique sua configuração `.env`
- Verifique se o servidor está chamando `connect()` na inicialização

### Problemas de Transação

Se você receber `TransactionNotFoundError`:
- Certifique-se de chamar `openTransaction()` antes das operações de transação
- Sempre chame `closeTransaction()` em um bloco `finally`

### Problemas de Migração

Se as migrações falharem:
- Verifique as credenciais do banco de dados
- Certifique-se de que o PostgreSQL está rodando
- Verifique a sintaxe do schema em `src/infra/repos/postgres/schemas/`

### Problemas de SSL

Se você receber erros de SSL no desenvolvimento:
- O projeto já está configurado para desabilitar SSL em desenvolvimento
- Em produção, o SSL é habilitado automaticamente
- Verifique a variável `NODE_ENV` no seu `.env`

## 📖 Próximos Passos

1. **Adicionar Mais Repositórios**: Siga o padrão em `pokemon-repository.ts`
2. **Criar Use Cases**: Implemente lógica de negócio usando contratos de repositórios
3. **Adicionar Controllers**: Crie endpoints HTTP usando Express
4. **Configurar Validação**: Adicione validação de entrada com validadores personalizados
5. **Adicionar Autenticação**: Implemente autenticação baseada em JWT ou sessão

## 📚 Recursos Adicionais

- [Documentação do Drizzle ORM](https://orm.drizzle.team/)
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Rodrigo Manguinho's Advanced Node](https://github.com/rmanguinho/advanced-node)
- [ADDING_NEW_REPOSITORY.md](./ADDING_NEW_REPOSITORY.md) - Guia completo para adicionar funcionalidades

## 🤝 Contribuindo

Ao adicionar novos recursos:
1. Crie contratos de domínio primeiro (interfaces)
2. Crie Use Cases com a lógica de negócio
3. Implemente na camada de infraestrutura
4. Crie controllers que orquestram os use cases
5. Crie factories para injeção de dependências
6. Escreva testes (almeje 100% de cobertura)
7. Atualize a documentação

## 🎓 Entendendo o Fluxo

```
HTTP Request
    ↓
Express Route
    ↓
Factory (compõe dependências)
    ├─→ Repository (infra)
    ├─→ Use Case (domain) ← LÓGICA DE NEGÓCIO
    └─→ Controller (application) ← ORQUESTRAÇÃO
        ↓
Controller.handle()
    ├─→ Valida entrada (buildValidators)
    └─→ Chama Use Case (perform)
            ↓
        Use Case executa regras de negócio
            ↓
        Repository acessa banco de dados
            ↓
        Retorna resultado
    ↓
Controller trata erros e formata resposta HTTP
    ↓
Express envia resposta ao cliente
```

---

**Bom Código!** 🎉

# Documentação da Camada de Banco de Dados

## Fluxo de Trabalho

Fluxo básico para gerenciar o banco de dados com **Drizzle ORM**:

```bash
# Criar nova migração
npm run db:generate -- --name=<nome-da-migracao>

# Aplicar migrações no banco local
npm run db:migrate

# Inspecionar resultado no Drizzle Studio
npm run db:studio
```

## Visão Geral

Este projeto usa **Drizzle ORM** com **PostgreSQL** seguindo os princípios de **Clean Architecture**.

## Estrutura da Arquitetura

```
src/
├── domain/
│   └── contracts/
│       └── repos/                 # Contratos de repositórios (camada de domínio)
│           ├── pokemon-repository.ts
│           └── index.ts
├── application/
│   ├── contracts/
│   │   ├── db-transaction.ts     # Interface de transação
│   │   └── index.ts
│   └── decorators/
│       ├── db-transaction-controller.ts  # Decorator de transação
│       └── index.ts
├── infra/
│   └── repos/
│       └── postgres/              # Implementação PostgreSQL
│           ├── config/
│           │   └── drizzle.config.ts
│           ├── helpers/
│           │   ├── connection.ts  # PgConnection (Singleton)
│           │   ├── errors.ts
│           │   └── index.ts
│           ├── schemas/
│           │   ├── pokemon.ts
│           │   └── index.ts
│           ├── pokemon-repository.ts
│           ├── repository.ts      # Classe base de repositório
│           └── index.ts
└── main/
    ├── config/
    │   └── env.ts                 # Variáveis de ambiente
    └── factories/
        └── infra/
            └── repos/
                └── postgres/
                    ├── helpers/
                    │   └── connection.ts  # Factory de conexão
                    ├── pokemon-repository.ts
                    └── index.ts
```

## Componentes Principais

### 1. **PgConnection (Singleton)**

Gerencia a conexão com o banco de dados e transações.

```typescript
import { makePgConnection } from '@/main/factories/infra/repos/postgres';

const connection = makePgConnection();
await connection.connect();
```

**Métodos:**
- `connect()` - Estabelece conexão com o banco de dados
- `disconnect()` - Fecha a conexão com o banco de dados
- `openTransaction()` - Abre uma nova transação
- `closeTransaction()` - Fecha a transação atual
- `commit()` - Confirma a transação atual
- `rollback()` - Reverte a transação atual
- `getDb()` - Retorna a instância do Drizzle (transação se ativa)

### 2. **PgRepository (Classe Base)**

Classe base abstrata para todos os repositórios. Fornece acesso à instância do banco de dados Drizzle.

```typescript
export abstract class PgRepository {
  constructor(private readonly connection: PgConnection) {}
  
  protected getDb(): NodePgDatabase<typeof schema> {
    return this.connection.getDb();
  }
}
```

### 3. **Exemplo de Implementação de Repositório**

```typescript
export class PgPokemonRepository extends PgRepository implements PokemonRepository {
  async create(data: CreatePokemonParams): Promise<PokemonModel> {
    const db = this.getDb();
    const result = await db.insert(pokemons).values(data).returning();
    return result[0];
  }

  async loadById(id: number): Promise<PokemonModel | null> {
    const db = this.getDb();
    const result = await db.select().from(pokemons).where(eq(pokemons.id, id));
    return result[0] ?? null;
  }

  async listAll(): Promise<PokemonModel[]> {
    const db = this.getDb();
    return await db.select().from(pokemons);
  }
}
```

### 4. **DbTransactionController (Decorator)**

Envolve automaticamente controllers com suporte a transações.

```typescript
const controller = new SomeController();
const transactionalController = new DbTransactionController(
  controller,
  makePgConnection()
);
```

**Comportamento:**
- Abre transação antes da execução do controller
- Confirma em caso de sucesso
- Reverte em caso de erro
- Sempre fecha a transação no bloco finally

## Variáveis de Ambiente

Crie um arquivo `.env` com as seguintes variáveis:

```env
# Configuração do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pokemon_db
```

## Comandos do Drizzle

### Gerar Migrações
```bash
npm run db:generate
```

### Executar Migrações
```bash
npm run db:migrate
```

### Enviar Schema para o Banco de Dados
```bash
npm run db:push
```

### Abrir Drizzle Studio
```bash
npm run db:studio
```

## Exemplos de Uso

## Schema do Banco de Dados

### Tabela Pokemon

```
pokemons
├── id (serial, PK)              - Chave primária auto-incremento
├── tipo (varchar(50))           - Tipo do pokémon: "pikachu" | "charizard" | "mewtwo"
├── treinador (varchar(255))     - Nome do treinador
└── nivel (integer, default 1)   - Nível do pokémon (>= 0)

Restrições:
- tipo_valido: CHECK (tipo IN ('pikachu', 'charizard', 'mewtwo'))
- nivel_nao_negativo: CHECK (nivel >= 0)
```

**Regras:**
- `nivel` sempre começa em 1 quando um Pokémon é criado
- `nivel` nunca pode ser negativo (garantido pela restrição CHECK)
- `tipo` só pode ser um dos três valores permitidos (garantido pela restrição CHECK)

### Uso Básico do Repositório

```typescript
import { makePgPokemonRepository } from '@/main/factories/infra/repos/postgres';

const repository = makePgPokemonRepository();

// Criar um Pokémon (nivel começa em 1 automaticamente)
const pokemon = await repository.create({
  tipo: "pikachu",
  treinador: "Ash"
});

// Carregar um Pokémon por ID
const found = await repository.loadById(1);

// Listar todos os Pokémons
const all = await repository.listAll();

// Atualizar treinador
await repository.updateTreinador(1, "Gary");

// Atualizar nível
await repository.updateNivel(1, 10);

// Deletar Pokémon
await repository.deleteById(1);
```

### Usando Transações Manualmente

```typescript
import { makePgConnection, makePgPokemonRepository } from '@/main/factories/infra/repos/postgres';

const connection = makePgConnection();
const repository = makePgPokemonRepository();

try {
  await connection.openTransaction();
  
  // Suas operações de banco de dados aqui
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

// Envolva seu controller
const controller = new SomeController();
const transactionalController = new DbTransactionController(
  controller,
  makePgConnection()
);

// Todas as operações serão executadas em uma transação
await transactionalController.handle(request);
```

## Princípios de Design

### Princípios SOLID

1. **Responsabilidade Única**: Cada classe tem um único motivo para mudar
2. **Aberto/Fechado**: Aberto para extensão, fechado para modificação
3. **Substituição de Liskov**: Repositórios podem ser substituídos por suas interfaces
4. **Segregação de Interface**: Interfaces pequenas e focadas
5. **Inversão de Dependência**: Domínio depende de abstrações, não de implementações

### Camadas da Clean Architecture

1. **Domain**: Regras de negócio e contratos (interfaces)
2. **Application**: Casos de uso e lógica específica da aplicação
3. **Infrastructure**: Preocupações externas (banco de dados, APIs)
4. **Main**: Raiz de composição (factories, inicialização do servidor)

### Benefícios

- ✅ **Testabilidade**: Fácil fazer mock de repositórios usando interfaces
- ✅ **Flexibilidade**: Pode trocar de ORM sem mudar o domínio
- ✅ **Manutenibilidade**: Separação clara de responsabilidades
- ✅ **Segurança de Tipos**: Inferência completa de tipos TypeScript
- ✅ **Suporte a Transações**: Gerenciamento de transações integrado

## Tratamento de Erros

Erros personalizados são fornecidos para cenários comuns:

- `ConnectionNotFoundError`: Lançado ao tentar usar o DB antes de conectar
- `TransactionNotFoundError`: Lançado ao usar métodos de transação sem uma transação ativa

## Inicialização do Servidor

A conexão com o banco de dados é estabelecida antes do servidor iniciar:

```typescript
makePgConnection()
  .connect()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
```

## Adicionando Novos Repositórios

1. **Criar contrato no domínio** em `src/domain/contracts/repos/`
2. **Criar implementação** em `src/infra/repos/postgres/`
3. **Criar factory** em `src/main/factories/infra/repos/postgres/`
4. **Estender a classe base** PgRepository
5. **Implementar as interfaces** do contrato

Exemplo:

```typescript
// 1. Contrato do domínio
export interface UserRepository {
  loadById: (id: number) => Promise<UserModel | null>;
  create: (data: CreateUserParams) => Promise<UserModel>;
}

// 2. Implementação
export class PgUserRepository extends PgRepository implements UserRepository {
  async loadById(id: number): Promise<UserModel | null> {
    const db = this.getDb();
    // implementação
  }
  
  async create(data: CreateUserParams): Promise<UserModel> {
    const db = this.getDb();
    // implementação
  }
}

// 3. Factory
export const makePgUserRepository = (): PgUserRepository => {
  return new PgUserRepository(makePgConnection());
};
```

## Testes

Repositórios podem ser facilmente mockados para testes:

```typescript
const mockRepository: PokemonRepository = {
  create: jest.fn(),
  loadById: jest.fn().mockResolvedValue({ 
    id: 1, 
    tipo: "pikachu", 
    treinador: "Ash", 
    nivel: 5 
  }),
  listAll: jest.fn(),
  updateTreinador: jest.fn(),
  updateNivel: jest.fn(),
  deleteById: jest.fn()
};

// Use o mock nos seus testes
const result = await mockRepository.loadById(1);
```

## Boas Práticas

1. ✅ Sempre use factories para criar instâncias de repositórios
2. ✅ Mantenha a camada de domínio livre de dependências de infraestrutura
3. ✅ Use transações para operações que modificam múltiplos registros
4. ✅ Trate erros apropriadamente (try-catch com rollback)
5. ✅ Feche conexões graciosamente ao desligar a aplicação
6. ✅ Use comentários TypeDoc para melhor suporte da IDE
7. ✅ Siga convenções de nomenclatura (prefixo Pg para implementações PostgreSQL)

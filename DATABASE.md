# Database Layer Documentation

## Workflow

Fluxo básico para gerenciar o banco de dados com **Drizzle ORM**:

```bash
# Criar nova migração
npm run db:generate -- --name=<migration-name>

# Aplicar migrações no banco local
npm run db:migrate

# Inspecionar resultado no Drizzle Studio
npm run db:studio


## Overview

This project uses **Drizzle ORM** with **PostgreSQL** following **Clean Architecture** principles.

## Architecture Structure

```
src/
├── domain/
│   └── contracts/
│       └── repos/                 # Repository contracts (domain layer)
│           ├── pokemon-repository.ts
│           └── index.ts
├── application/
│   ├── contracts/
│   │   ├── db-transaction.ts     # Transaction interface
│   │   └── index.ts
│   └── decorators/
│       ├── db-transaction-controller.ts  # Transaction decorator
│       └── index.ts
├── infra/
│   └── repos/
│       └── postgres/              # PostgreSQL implementation
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
│           ├── repository.ts      # Base repository class
│           └── index.ts
└── main/
    ├── config/
    │   └── env.ts                 # Environment variables
    └── factories/
        └── infra/
            └── repos/
                └── postgres/
                    ├── helpers/
                    │   └── connection.ts  # Connection factory
                    ├── pokemon-repository.ts
                    └── index.ts
```

## Key Components

### 1. **PgConnection (Singleton)**

Manages the database connection and transactions.

```typescript
import { makePgConnection } from '@/main/factories/infra/repos/postgres';

const connection = makePgConnection();
await connection.connect();
```

**Methods:**
- `connect()` - Establishes database connection
- `disconnect()` - Closes database connection
- `openTransaction()` - Opens a new transaction
- `closeTransaction()` - Closes current transaction
- `commit()` - Commits current transaction
- `rollback()` - Rolls back current transaction
- `getDb()` - Returns Drizzle instance (transaction if active)

### 2. **PgRepository (Base Class)**

Abstract base class for all repositories. Provides access to the Drizzle database instance.

```typescript
export abstract class PgRepository {
  constructor(private readonly connection: PgConnection) {}
  
  protected getDb(): NodePgDatabase<typeof schema> {
    return this.connection.getDb();
  }
}
```

### 3. **Repository Implementation Example**

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

Automatically wraps controllers with transaction support.

```typescript
const controller = new SomeController();
const transactionalController = new DbTransactionController(
  controller,
  makePgConnection()
);
```

**Behavior:**
- Opens transaction before controller execution
- Commits on success
- Rolls back on error
- Always closes transaction in finally block

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pokemon_db
```

## Drizzle Commands

### Generate Migrations
```bash
npm run db:generate
```

### Run Migrations
```bash
npm run db:migrate
```

### Push Schema to Database
```bash
npm run db:push
```

### Open Drizzle Studio
```bash
npm run db:studio
```

## Usage Examples

## Database Schema

### Pokemon Table

```
pokemons
├── id (serial, PK)              - Auto-increment primary key
├── tipo (varchar(50))           - Pokemon type: "pikachu" | "charizard" | "mewtwo"
├── treinador (varchar(255))     - Trainer name
└── nivel (integer, default 1)   - Pokemon level (>= 0)

Constraints:
- tipo_valido: CHECK (tipo IN ('pikachu', 'charizard', 'mewtwo'))
- nivel_nao_negativo: CHECK (nivel >= 0)
```

**Rules:**
- `nivel` always starts at 1 when a Pokemon is created
- `nivel` can never be negative (enforced by CHECK constraint)
- `tipo` can only be one of the three allowed values (enforced by CHECK constraint)

### Basic Repository Usage

```typescript
import { makePgPokemonRepository } from '@/main/factories/infra/repos/postgres';

const repository = makePgPokemonRepository();

// Create a Pokemon (nivel starts at 1 automatically)
const pokemon = await repository.create({
  tipo: "pikachu",
  treinador: "Ash"
});

// Load a Pokemon by ID
const found = await repository.loadById(1);

// List all Pokemon
const all = await repository.listAll();

// Update treinador
await repository.updateTreinador(1, "Gary");

// Update nivel
await repository.updateNivel(1, 10);

// Delete Pokemon
await repository.deleteById(1);
```

### Using Transactions Manually

```typescript
import { makePgConnection, makePgPokemonRepository } from '@/main/factories/infra/repos/postgres';

const connection = makePgConnection();
const repository = makePgPokemonRepository();

try {
  await connection.openTransaction();
  
  // Your database operations here
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

### Using Transaction Decorator

```typescript
import { DbTransactionController } from '@/application/decorators';
import { makePgConnection } from '@/main/factories/infra/repos/postgres';

// Wrap your controller
const controller = new SomeController();
const transactionalController = new DbTransactionController(
  controller,
  makePgConnection()
);

// All operations will run in a transaction
await transactionalController.handle(request);
```

## Design Principles

### SOLID Principles

1. **Single Responsibility**: Each class has one reason to change
2. **Open/Closed**: Open for extension, closed for modification
3. **Liskov Substitution**: Repositories can be substituted by their interfaces
4. **Interface Segregation**: Small, focused interfaces
5. **Dependency Inversion**: Domain depends on abstractions, not implementations

### Clean Architecture Layers

1. **Domain**: Business rules and contracts (interfaces)
2. **Application**: Use cases and application-specific logic
3. **Infrastructure**: External concerns (database, APIs)
4. **Main**: Composition root (factories, server initialization)

### Benefits

- ✅ **Testability**: Easy to mock repositories using interfaces
- ✅ **Flexibility**: Can switch ORM without changing domain
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Type Safety**: Full TypeScript type inference
- ✅ **Transaction Support**: Built-in transaction management

## Error Handling

Custom errors are provided for common scenarios:

- `ConnectionNotFoundError`: Thrown when trying to use DB before connecting
- `TransactionNotFoundError`: Thrown when using transaction methods without an active transaction

## Server Initialization

The database connection is established before the server starts:

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

## Adding New Repositories

1. **Create domain contract** in `src/domain/contracts/repos/`
2. **Create implementation** in `src/infra/repos/postgres/`
3. **Create factory** in `src/main/factories/infra/repos/postgres/`
4. **Extend PgRepository** base class
5. **Implement contract interfaces**

Example:

```typescript
// 1. Domain contract
export interface UserRepository {
  loadById: (id: number) => Promise<UserModel | null>;
  create: (data: CreateUserParams) => Promise<UserModel>;
}

// 2. Implementation
export class PgUserRepository extends PgRepository implements UserRepository {
  async loadById(id: number): Promise<UserModel | null> {
    const db = this.getDb();
    // implementation
  }
  
  async create(data: CreateUserParams): Promise<UserModel> {
    const db = this.getDb();
    // implementation
  }
}

// 3. Factory
export const makePgUserRepository = (): PgUserRepository => {
  return new PgUserRepository(makePgConnection());
};
```

## Testing

Repositories can be easily mocked for testing:

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

// Use mock in your tests
const result = await mockRepository.loadById(1);
```

## Best Practices

1. ✅ Always use factories to create repository instances
2. ✅ Keep domain layer free of infrastructure dependencies
3. ✅ Use transactions for operations that modify multiple records
4. ✅ Handle errors appropriately (try-catch with rollback)
5. ✅ Close connections gracefully on application shutdown
6. ✅ Use TypeDoc comments for better IDE support
7. ✅ Follow naming conventions (Pg prefix for PostgreSQL implementations)


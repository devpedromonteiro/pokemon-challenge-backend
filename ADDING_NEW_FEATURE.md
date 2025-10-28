# Guia: Adicionando um Novo Repositório e Funcionalidade

Este guia demonstra como adicionar uma nova funcionalidade completa seguindo os princípios de Clean Architecture, onde **Use Cases contêm a lógica de negócio** e **Controllers apenas orquestram**.

## Exemplo: Criando um Sistema de Usuários

Vamos criar um sistema completo de usuários do zero, incluindo criação e busca.

---

## 📋 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  MAIN (Composição)                                          │
│  • Factories: Instancia e injeta dependências               │
│  • Routes: Registra endpoints Express                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION (Orquestração)                                 │
│  • Controllers: Validam entrada e chamam Use Cases          │
│  • Validators: Regras de validação de entrada               │
│  • Decorators: DbTransactionController, etc.                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN (Regras de Negócio)                                 │
│  • Use Cases: TODA a lógica de negócio                      │
│  • Contracts/Repos: Interfaces de repositórios              │
│  • Types: Modelos de domínio                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRA (Implementações Concretas)                           │
│  • Repositories: Implementam contratos do domain            │
│  • Schemas: Definições de tabelas (Drizzle)                 │
│  • Connection: Gerenciamento de conexão com banco           │
└─────────────────────────────────────────────────────────────┘
```

---

## Passo 1: Criar o Schema do Banco de Dados

**Arquivo:** `src/infra/repos/postgres/schemas/user.ts`

```typescript
import { integer, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Schema da tabela de usuários
 */
export const userTable = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;
```

**Atualizar:** `src/infra/repos/postgres/schemas/index.ts`

```typescript
export * from "./pokemon";
export * from "./user"; // Adicionar esta linha
```

---

## Passo 2: Definir o Modelo de Domínio

**Arquivo:** `src/domain/contracts/repos/user-repository.ts`

```typescript
/**
 * Modelo de domínio para User
 */
export type UserModel = {
    id: number;
    name: string;
    email: string;
    password?: string; // Opcional para não expor em respostas
    createdAt?: Date;
    updatedAt?: Date;
};

/**
 * Interface do repositório de usuários
 * Define TODOS os métodos de acesso a dados necessários
 */
export interface UserRepository {
    /**
     * Cria um novo usuário
     */
    create(data: { name: string; email: string; password: string }): Promise<UserModel>;

    /**
     * Busca um usuário por ID
     */
    loadById(id: number): Promise<UserModel | null>;

    /**
     * Busca um usuário por email
     */
    loadByEmail(email: string): Promise<UserModel | null>;

    /**
     * Atualiza o nome do usuário
     */
    updateName(id: number, name: string): Promise<void>;

    /**
     * Deleta um usuário
     */
    deleteById(id: number): Promise<void>;

    /**
     * Lista todos os usuários
     */
    loadAll(): Promise<UserModel[]>;
}
```

**Atualizar:** `src/domain/contracts/repos/index.ts`

```typescript
export * from "./pokemon-repository";
export * from "./user-repository"; // Adicionar esta linha
```

---

## Passo 3: Criar os Use Cases (LÓGICA DE NEGÓCIO)

### Use Case 1: Criar Usuário

**Arquivo:** `src/domain/use-cases/create-user.ts`

```typescript
import { UserAlreadyExistsError } from "@/application/errors";
import type { UserModel, UserRepository } from "@/domain/contracts/repos";

type Setup = (userRepository: UserRepository) => CreateUser;
type Input = { name: string; email: string; password: string };
type Output = UserModel;
export type CreateUser = (input: Input) => Promise<Output>;

/**
 * Use Case: Criar um novo usuário
 * 
 * Regras de Negócio:
 * - Email deve ser único (não pode existir outro usuário com o mesmo email)
 * - Senha deve ser hasheada antes de salvar
 * - Retorna o usuário criado (sem a senha)
 */
export const setupCreateUser: Setup = (userRepository) => async (input) => {
    // Verifica se já existe usuário com este email
    const existingUser = await userRepository.loadByEmail(input.email);
    if (existingUser) {
        throw new UserAlreadyExistsError();
    }

    // TODO: Hash da senha (aqui deveria usar bcrypt ou similar)
    const hashedPassword = `hashed_${input.password}`;

    // Cria o usuário
    const user = await userRepository.create({
        name: input.name,
        email: input.email,
        password: hashedPassword,
    });

    // Remove a senha da resposta
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
```

### Use Case 2: Buscar Usuário por ID

**Arquivo:** `src/domain/use-cases/load-user-by-id.ts`

```typescript
import { UserNotFoundError } from "@/application/errors";
import type { UserModel, UserRepository } from "@/domain/contracts/repos";

type Setup = (userRepository: UserRepository) => LoadUserById;
type Input = { userId: number };
type Output = UserModel;
export type LoadUserById = (input: Input) => Promise<Output>;

/**
 * Use Case: Buscar um usuário por ID
 * 
 * Regras de Negócio:
 * - Se o usuário não existir, lança UserNotFoundError
 * - Não retorna a senha na resposta
 */
export const setupLoadUserById: Setup = (userRepository) => async ({ userId }) => {
    const user = await userRepository.loadById(userId);

    if (!user) {
        throw new UserNotFoundError();
    }

    // Remove a senha da resposta
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
```

### Use Case 3: Atualizar Nome do Usuário

**Arquivo:** `src/domain/use-cases/update-user-name.ts`

```typescript
import { UserNotFoundError } from "@/application/errors";
import type { UserModel, UserRepository } from "@/domain/contracts/repos";

type Setup = (userRepository: UserRepository) => UpdateUserName;
type Input = { userId: number; name: string };
type Output = UserModel;
export type UpdateUserName = (input: Input) => Promise<Output>;

/**
 * Use Case: Atualizar nome do usuário
 * 
 * Regras de Negócio:
 * - Usuário deve existir
 * - Nome não pode ser vazio (validação já feita no controller)
 * - Retorna o usuário atualizado
 */
export const setupUpdateUserName: Setup = (userRepository) => async ({ userId, name }) => {
    // Verifica se o usuário existe
    const user = await userRepository.loadById(userId);
    if (!user) {
        throw new UserNotFoundError();
    }

    // Atualiza o nome
    await userRepository.updateName(userId, name);

    // Busca e retorna o usuário atualizado
    const updatedUser = await userRepository.loadById(userId);
    const { password, ...userWithoutPassword } = updatedUser!;
    return userWithoutPassword;
};
```

**Atualizar:** `src/domain/use-cases/index.ts`

```typescript
export * from "./battle-pokemon";
export * from "./create-pokemon";
export * from "./create-user"; // Adicionar estas linhas
export * from "./load-user-by-id";
export * from "./update-user-name";
// ... outros use cases de user
```

---

## Passo 4: Criar Erros Personalizados

**Arquivo:** `src/application/errors/user-already-exists.ts`

```typescript
export class UserAlreadyExistsError extends Error {
    constructor() {
        super("User already exists");
        this.name = "UserAlreadyExistsError";
    }
}
```

**Arquivo:** `src/application/errors/user-not-found.ts`

```typescript
export class UserNotFoundError extends Error {
    constructor() {
        super("User not found");
        this.name = "UserNotFoundError";
    }
}
```

**Atualizar:** `src/application/errors/index.ts`

```typescript
export * from "./http";
export * from "./pokemon-not-found";
export * from "./user-already-exists"; // Adicionar estas linhas
export * from "./user-not-found";
export * from "./validation";
```

---

## Passo 5: Criar os Controllers (ORQUESTRAÇÃO)

### Controller 1: Criar Usuário

**Arquivo:** `src/application/controllers/user/create-user.ts`

```typescript
import { Controller } from "@/application/controllers";
import { UserAlreadyExistsError } from "@/application/errors";
import { badRequest, created, type HttpResponse } from "@/application/helpers";
import { RequiredString, type Validator } from "@/application/validation";
import type { CreateUser } from "@/domain/use-cases";
import type { UserModel } from "@/domain/contracts/repos";

type HttpRequest = {
    name?: string;
    email?: string;
    password?: string;
};

type Model = Error | UserModel;

/**
 * Controller para criação de usuários.
 * Responsabilidades:
 * - Validar entrada (campos obrigatórios)
 * - Chamar o Use Case
 * - Tratar erros específicos (UserAlreadyExistsError)
 * - Retornar resposta HTTP apropriada
 */
export class CreateUserController extends Controller {
    constructor(private readonly createUser: CreateUser) {
        super();
    }

    /**
     * Valida os campos de entrada
     */
    override buildValidators(httpRequest: HttpRequest): Validator[] {
        return [
            new RequiredString(httpRequest.name, "name"),
            new RequiredString(httpRequest.email, "email"),
            new RequiredString(httpRequest.password, "password"),
        ];
    }

    /**
     * Executa o Use Case e retorna a resposta
     */
    async perform(httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        try {
            const user = await this.createUser({
                name: httpRequest.name!,
                email: httpRequest.email!,
                password: httpRequest.password!,
            });

            return created(user);
        } catch (error) {
            if (error instanceof UserAlreadyExistsError) {
                return badRequest(error);
            }
            throw error; // Re-lança erros inesperados para o handler global
        }
    }
}
```

### Controller 2: Buscar Usuário por ID

**Arquivo:** `src/application/controllers/user/load-user-by-id.ts`

```typescript
import { Controller } from "@/application/controllers";
import { UserNotFoundError } from "@/application/errors";
import { notFound, ok, type HttpResponse } from "@/application/helpers";
import { RequiredNumber, type Validator } from "@/application/validation";
import type { LoadUserById } from "@/domain/use-cases";
import type { UserModel } from "@/domain/contracts/repos";

type HttpRequest = {
    userId?: string; // Vem como string da URL
};

type Model = Error | UserModel;

/**
 * Controller para buscar usuário por ID.
 */
export class LoadUserByIdController extends Controller {
    constructor(private readonly loadUserById: LoadUserById) {
        super();
    }

    override buildValidators(httpRequest: HttpRequest): Validator[] {
        return [new RequiredNumber(Number(httpRequest.userId), "userId")];
    }

    async perform(httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        try {
            const user = await this.loadUserById({
                userId: Number(httpRequest.userId),
            });

            return ok(user);
        } catch (error) {
            if (error instanceof UserNotFoundError) {
                return notFound(error);
            }
            throw error;
        }
    }
}
```

**Criar:** `src/application/controllers/user/index.ts`

```typescript
export * from "./create-user";
export * from "./load-user-by-id";
export * from "./update-user-name";
```

---

## Passo 6: Implementar o Repositório (INFRA)

**Arquivo:** `src/infra/repos/postgres/user-repository.ts`

```typescript
import { eq } from "drizzle-orm";
import type { UserModel, UserRepository } from "@/domain/contracts/repos";
import { PgRepository } from "./repository";
import { userTable } from "./schemas";

/**
 * Implementação PostgreSQL do repositório de usuários
 * Implementa TODOS os métodos definidos na interface UserRepository
 */
export class PgUserRepository extends PgRepository implements UserRepository {
    /**
     * Cria um novo usuário
     */
    async create(data: {
        name: string;
        email: string;
        password: string;
    }): Promise<UserModel> {
        const db = this.getDb();
        const result = await db
            .insert(userTable)
            .values({
                name: data.name,
                email: data.email,
                password: data.password,
            })
            .returning({
                id: userTable.id,
                name: userTable.name,
                email: userTable.email,
                createdAt: userTable.createdAt,
                updatedAt: userTable.updatedAt,
            });

        return result[0];
    }

    /**
     * Busca um usuário por ID
     */
    async loadById(id: number): Promise<UserModel | null> {
        const db = this.getDb();
        const result = await db
            .select({
                id: userTable.id,
                name: userTable.name,
                email: userTable.email,
                password: userTable.password,
                createdAt: userTable.createdAt,
                updatedAt: userTable.updatedAt,
            })
            .from(userTable)
            .where(eq(userTable.id, id))
            .limit(1);

        return result[0] ?? null;
    }

    /**
     * Busca um usuário por email
     */
    async loadByEmail(email: string): Promise<UserModel | null> {
        const db = this.getDb();
        const result = await db
            .select({
                id: userTable.id,
                name: userTable.name,
                email: userTable.email,
                password: userTable.password,
                createdAt: userTable.createdAt,
                updatedAt: userTable.updatedAt,
            })
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);

        return result[0] ?? null;
    }

    /**
     * Atualiza o nome do usuário
     */
    async updateName(id: number, name: string): Promise<void> {
        const db = this.getDb();
        await db
            .update(userTable)
            .set({
                name,
                updatedAt: new Date(),
            })
            .where(eq(userTable.id, id));
    }

    /**
     * Deleta um usuário
     */
    async deleteById(id: number): Promise<void> {
        const db = this.getDb();
        await db.delete(userTable).where(eq(userTable.id, id));
    }

    /**
     * Lista todos os usuários
     */
    async loadAll(): Promise<UserModel[]> {
        const db = this.getDb();
        const result = await db
            .select({
                id: userTable.id,
                name: userTable.name,
                email: userTable.email,
                createdAt: userTable.createdAt,
                updatedAt: userTable.updatedAt,
            })
            .from(userTable);

        return result;
    }
}
```

**Atualizar:** `src/infra/repos/postgres/index.ts`

```typescript
export * from "./helpers";
export * from "./pokemon-repository";
export * from "./user-repository"; // Adicionar esta linha
export * from "./repository";
export * from "./schemas";
```

---

## Passo 7: Criar Factories (COMPOSIÇÃO)

### Factory do Repositório

**Arquivo:** `src/main/factories/infra/repos/postgres/user-repository.ts`

```typescript
import { PgUserRepository } from "@/infra/repos/postgres/user-repository";
import { makePgConnection } from "./helpers/connection";

/**
 * Factory para criar instância do PgUserRepository
 */
export const makePgUserRepository = (): PgUserRepository => {
    return new PgUserRepository(makePgConnection());
};
```

**Atualizar:** `src/main/factories/infra/repos/postgres/index.ts`

```typescript
export * from "./helpers/connection";
export * from "./pokemon-repository";
export * from "./user-repository"; // Adicionar esta linha
```

### Factories dos Controllers

**Arquivo:** `src/main/factories/application/controllers/create-user.ts`

```typescript
import { CreateUserController } from "@/application/controllers/user";
import { DbTransactionController } from "@/application/decorators";
import { setupCreateUser } from "@/domain/use-cases";
import { makePgConnection } from "@/main/factories/infra/repos/postgres";
import { makePgUserRepository } from "@/main/factories/infra/repos/postgres/user-repository";

/**
 * Factory para criar o CreateUserController com injeção de dependências
 * 
 * Fluxo:
 * 1. Cria instância do repositório
 * 2. Cria o Use Case injetando o repositório
 * 3. Cria o Controller injetando o Use Case
 * 4. Envolve com DbTransactionController para garantir transação
 */
export const makeCreateUserController = (): DbTransactionController => {
    const repository = makePgUserRepository();
    const createUser = setupCreateUser(repository);
    const controller = new CreateUserController(createUser);
    return new DbTransactionController(controller, makePgConnection());
};
```

**Arquivo:** `src/main/factories/application/controllers/load-user-by-id.ts`

```typescript
import { LoadUserByIdController } from "@/application/controllers/user";
import { setupLoadUserById } from "@/domain/use-cases";
import { makePgUserRepository } from "@/main/factories/infra/repos/postgres/user-repository";

/**
 * Factory para criar o LoadUserByIdController
 * Não precisa de transação pois é apenas leitura
 */
export const makeLoadUserByIdController = (): LoadUserByIdController => {
    const repository = makePgUserRepository();
    const loadUserById = setupLoadUserById(repository);
    return new LoadUserByIdController(loadUserById);
};
```

**Atualizar:** `src/main/factories/application/controllers/index.ts`

```typescript
export * from "./battle-pokemon";
export * from "./create-pokemon";
export * from "./create-user"; // Adicionar estas linhas
export * from "./load-user-by-id";
// ... outros controllers
```

---

## Passo 8: Criar Rotas (EXPRESS)

**Arquivo:** `src/main/routes/user.ts`

```typescript
import type { Router } from "express";
import { adaptExpressRoute } from "@/main/adapters";
import {
    makeCreateUserController,
    makeLoadUserByIdController,
} from "@/main/factories/application/controllers";

/**
 * Registra as rotas de usuários
 */
export default (router: Router): void => {
    // POST /users - Criar novo usuário
    router.post("/users", adaptExpressRoute(makeCreateUserController()));

    // GET /users/:userId - Buscar usuário por ID
    router.get("/users/:userId", adaptExpressRoute(makeLoadUserByIdController()));
};
```

> ℹ️ **Nota**: O arquivo será automaticamente carregado pelo sistema de rotas dinâmico em `src/main/config/routes.ts`.

---

## Passo 9: Gerar e Aplicar Migrations

```bash
# Gerar migration files
npm run db:generate

# Aplicar migrations no banco (desenvolvimento)
npm run db:push

# Ou aplicar via migrate (produção)
npm run db:migrate
```

---

## Passo 10: Escrever Testes

### Testes Unitários do Use Case

**Arquivo:** `tests/domain/use-cases/create-user.spec.ts`

```typescript
import { type MockProxy, mock } from "jest-mock-extended";
import type { UserModel, UserRepository } from "@/domain/contracts/repos";
import { setupCreateUser } from "@/domain/use-cases";
import { UserAlreadyExistsError } from "@/application/errors";

describe("CreateUser Use Case", () => {
    let userRepository: MockProxy<UserRepository>;
    let sut: ReturnType<typeof setupCreateUser>;

    beforeAll(() => {
        userRepository = mock<UserRepository>();
        sut = setupCreateUser(userRepository);
    });

    it("should create a new user", async () => {
        const newUser: UserModel = {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
        };

        userRepository.loadByEmail.mockResolvedValueOnce(null); // Email não existe
        userRepository.create.mockResolvedValueOnce(newUser);

        const result = await sut({
            name: "John Doe",
            email: "john@example.com",
            password: "123456",
        });

        expect(result).toEqual(newUser);
        expect(userRepository.loadByEmail).toHaveBeenCalledWith("john@example.com");
        expect(userRepository.create).toHaveBeenCalledWith({
            name: "John Doe",
            email: "john@example.com",
            password: expect.stringContaining("hashed_"),
        });
    });

    it("should throw UserAlreadyExistsError if email is already in use", async () => {
        userRepository.loadByEmail.mockResolvedValueOnce({
            id: 1,
            name: "Existing User",
            email: "existing@example.com",
        });

        const promise = sut({
            name: "New User",
            email: "existing@example.com",
            password: "123456",
        });

        await expect(promise).rejects.toThrow(new UserAlreadyExistsError());
        expect(userRepository.create).not.toHaveBeenCalled();
    });
});
```

### Testes Unitários do Controller

**Arquivo:** `tests/application/controllers/create-user.spec.ts`

```typescript
import { CreateUserController } from "@/application/controllers/user";
import { Controller } from "@/application/controllers";
import { badRequest, created } from "@/application/helpers";
import { UserAlreadyExistsError, ValidationError } from "@/application/errors";
import type { CreateUser } from "@/domain/use-cases";
import type { UserModel } from "@/domain/contracts/repos";

describe("CreateUserController", () => {
    let sut: CreateUserController;
    let createUser: jest.Mock;

    beforeAll(() => {
        createUser = jest.fn();
        sut = new CreateUserController(createUser);
    });

    it("should extend Controller", () => {
        expect(sut).toBeInstanceOf(Controller);
    });

    describe("buildValidators", () => {
        it("should return error if name is missing", async () => {
            const httpRequest = { email: "john@example.com", password: "123456" };
            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(ValidationError);
        });

        it("should return error if email is missing", async () => {
            const httpRequest = { name: "John", password: "123456" };
            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(ValidationError);
        });

        it("should return error if password is missing", async () => {
            const httpRequest = { name: "John", email: "john@example.com" };
            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(ValidationError);
        });
    });

    describe("perform", () => {
        it("should return 201 with created user", async () => {
            const user: UserModel = {
                id: 1,
                name: "John Doe",
                email: "john@example.com",
            };

            createUser.mockResolvedValueOnce(user);

            const httpRequest = {
                name: "John Doe",
                email: "john@example.com",
                password: "123456",
            };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse).toEqual(created(user));
            expect(createUser).toHaveBeenCalledWith(httpRequest);
        });

        it("should return 400 if UserAlreadyExistsError is thrown", async () => {
            createUser.mockRejectedValueOnce(new UserAlreadyExistsError());

            const httpRequest = {
                name: "John Doe",
                email: "existing@example.com",
                password: "123456",
            };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse).toEqual(badRequest(new UserAlreadyExistsError()));
        });
    });
});
```

### Testes de Integração

**Arquivo:** `tests/main/routes/create-user.test.ts`

```typescript
import request from "supertest";
import { app } from "@/main/config/app";
import { makePgUserRepository } from "@/main/factories/infra/repos/postgres/user-repository";

describe("POST /users - Integration Tests", () => {
    const repository = makePgUserRepository();

    beforeEach(async () => {
        // Limpar usuários de teste
        // await repository.deleteAll(); // Implementar se necessário
    });

    it("should create a new user and return 201", async () => {
        const response = await request(app)
            .post("/users")
            .send({
                name: "John Doe",
                email: "john@example.com",
                password: "123456",
            })
            .expect(201);

        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("John Doe");
        expect(response.body.email).toBe("john@example.com");
        expect(response.body).not.toHaveProperty("password"); // Senha não deve ser retornada
    });

    it("should return 400 if email already exists", async () => {
        // Criar primeiro usuário
        await repository.create({
            name: "First User",
            email: "duplicate@example.com",
            password: "hashed_password",
        });

        // Tentar criar com mesmo email
        const response = await request(app)
            .post("/users")
            .send({
                name: "Second User",
                email: "duplicate@example.com",
                password: "123456",
            })
            .expect(400);

        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("User already exists");
    });

    it("should return 400 if required fields are missing", async () => {
        const response = await request(app)
            .post("/users")
            .send({
                name: "John Doe",
                // email e password faltando
            })
            .expect(400);

        expect(response.body).toHaveProperty("error");
    });
});
```

Rodar os testes:

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Todos os testes
npm run test:all
```

---

## Passo 11: Documentar no OpenAPI

**Atualizar:** `docs/openapi.yaml`

```yaml
paths:
  /users:
    post:
      summary: Criar novo usuário
      tags:
        - Usuários
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - email
                - password
              properties:
                name:
                  type: string
                  example: "John Doe"
                email:
                  type: string
                  format: email
                  example: "john@example.com"
                password:
                  type: string
                  format: password
                  example: "senha123"
      responses:
        "201":
          description: Usuário criado com sucesso
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          description: Email já existe ou dados inválidos
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string

  /users/{userId}:
    get:
      summary: Buscar usuário por ID
      tags:
        - Usuários
      parameters:
        - in: path
          name: userId
          required: true
          schema:
            type: integer
          description: ID do usuário
      responses:
        "200":
          description: Usuário encontrado
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "404":
          description: Usuário não encontrado

components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
        - email
      properties:
        id:
          type: integer
          example: 1
        name:
          type: string
          example: "John Doe"
        email:
          type: string
          format: email
          example: "john@example.com"
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
```

---

## 📋 Checklist Completo

Ao adicionar uma nova funcionalidade, certifique-se de:

### Domain Layer
- [ ] Criar modelo de domínio (`UserModel`)
- [ ] Criar interface do repositório (`UserRepository`)
- [ ] Criar Use Cases com lógica de negócio (`setupCreateUser`, etc.)
- [ ] Exportar tudo em `domain/contracts/repos/index.ts`
- [ ] Exportar use cases em `domain/use-cases/index.ts`

### Application Layer
- [ ] Criar erros personalizados (`UserAlreadyExistsError`, etc.)
- [ ] Criar controllers que orquestram (`CreateUserController`, etc.)
- [ ] Implementar `buildValidators()` em cada controller
- [ ] Implementar `perform()` tratando erros específicos
- [ ] Exportar controllers em `application/controllers/user/index.ts`

### Infra Layer
- [ ] Criar schema do banco (`userTable`)
- [ ] Criar repositório implementando a interface (`PgUserRepository`)
- [ ] Implementar TODOS os métodos da interface
- [ ] Exportar schema e repositório nos `index.ts`

### Main Layer
- [ ] Criar factory do repositório (`makePgUserRepository`)
- [ ] Criar factories dos controllers (`makeCreateUserController`, etc.)
- [ ] Envolver controllers de escrita com `DbTransactionController`
- [ ] Criar arquivo de rotas (`user.ts`)
- [ ] Exportar factories em `index.ts`

### Migrations
- [ ] Gerar migrations com `npm run db:generate`
- [ ] Aplicar migrations com `npm run db:push` ou `npm run db:migrate`

### Testes
- [ ] Testes unitários dos Use Cases (mockando repositório)
- [ ] Testes unitários dos Controllers (mockando use case)
- [ ] Testes de integração das rotas (banco real)
- [ ] Garantir cobertura > 80%

### Documentação
- [ ] Adicionar endpoints no `openapi.yaml`
- [ ] Adicionar schemas no `openapi.yaml`
- [ ] Atualizar `README.md` se necessário

---

## 🎯 Padrões e Convenções

### Nomenclatura

```
Domain:
- Interface: UserRepository
- Modelo: UserModel
- Use Case Type: CreateUser
- Setup Function: setupCreateUser

Application:
- Controller: CreateUserController
- Error: UserAlreadyExistsError

Infra:
- Repository: PgUserRepository
- Schema: userTable

Main:
- Factory Repo: makePgUserRepository
- Factory Controller: makeCreateUserController
- Route File: user.ts
```

### Estrutura de Use Case

```typescript
type Setup = (repository: Repository) => UseCase;
type Input = { /* params */ };
type Output = /* return type */;
export type UseCase = (input: Input) => Promise<Output>;

export const setupUseCase: Setup = (repository) => async (input) => {
    // 1. Validações de negócio
    // 2. Carregar dados necessários
    // 3. Aplicar regras de negócio
    // 4. Persistir mudanças
    // 5. Retornar resultado
};
```

### Estrutura de Controller

```typescript
export class MyController extends Controller {
    constructor(private readonly useCase: UseCase) {
        super();
    }

    override buildValidators(httpRequest: HttpRequest): Validator[] {
        // Validações de entrada (formato, obrigatoriedade)
    }

    async perform(httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        try {
            const result = await this.useCase({ /* input */ });
            return ok(result); // ou created(), etc.
        } catch (error) {
            if (error instanceof SpecificError) {
                return badRequest(error); // ou notFound(), etc.
            }
            throw error; // Re-lança erros inesperados
        }
    }
}
```

### Estrutura de Factory

```typescript
export const makeMyController = (): DbTransactionController => {
    // 1. Criar repositório
    const repository = makePgMyRepository();
    
    // 2. Criar use case
    const myUseCase = setupMyUseCase(repository);
    
    // 3. Criar controller
    const controller = new MyController(myUseCase);
    
    // 4. Envolver com transação (se for operação de escrita)
    return new DbTransactionController(controller, makePgConnection());
};
```

---

## 🔧 Operações Comuns

### Update com Condições

```typescript
export const setupUpdateUser: Setup = (userRepository) => async ({ userId, data }) => {
    const user = await userRepository.loadById(userId);
    if (!user) {
        throw new UserNotFoundError();
    }

    // Validações de negócio
    if (data.email && data.email !== user.email) {
        const emailInUse = await userRepository.loadByEmail(data.email);
        if (emailInUse) {
            throw new EmailAlreadyInUseError();
        }
    }

    await userRepository.update(userId, data);
    return userRepository.loadById(userId);
};
```

### Delete com Verificações

```typescript
export const setupDeleteUser: Setup = (userRepository) => async ({ userId }) => {
    const user = await userRepository.loadById(userId);
    if (!user) {
        throw new UserNotFoundError();
    }

    // Regras de negócio para deleção
    // Ex: Não pode deletar admin, etc.

    await userRepository.deleteById(userId);
};
```

### List com Paginação

```typescript
export const setupListUsers: Setup = (userRepository) => async ({ page = 1, limit = 10 }) => {
    const users = await userRepository.loadAll(page, limit);
    return users;
};

// No repositório:
async loadAll(page: number, limit: number): Promise<UserModel[]> {
    const db = this.getDb();
    const offset = (page - 1) * limit;
    
    return db
        .select()
        .from(userTable)
        .limit(limit)
        .offset(offset);
}
```

### Operações com Transação Explícita

```typescript
// Use o DbTransactionController na factory que já gerencia automaticamente!
// Mas se precisar de controle manual:

export const setupComplexOperation: Setup = (repository) => async (input) => {
    // A transação é gerenciada pelo DbTransactionController decorator
    // Todas as operações dentro do use case estarão na mesma transação
    
    await repository.createUser(input.user);
    await repository.createProfile(input.profile);
    await repository.createSettings(input.settings);
    
    // Se qualquer operação falhar, o DbTransactionController faz rollback
};
```

---

## 🚀 Boas Práticas

### ✅ DO (Fazer)

1. **Use Cases com lógica de negócio**
   ```typescript
   // ✅ CERTO: Lógica no Use Case
   export const setupCreateUser: Setup = (repo) => async (input) => {
       const exists = await repo.loadByEmail(input.email);
       if (exists) throw new UserAlreadyExistsError();
       return repo.create(input);
   };
   ```

2. **Controllers apenas orquestram**
   ```typescript
   // ✅ CERTO: Controller só valida e chama use case
   async perform(req: HttpRequest): Promise<HttpResponse> {
       try {
           const result = await this.createUser(req);
           return created(result);
       } catch (error) {
           if (error instanceof UserAlreadyExistsError) {
               return badRequest(error);
           }
           throw error;
       }
   }
   ```

3. **Repositórios sem lógica de negócio**
   ```typescript
   // ✅ CERTO: Repositório só acessa dados
   async create(data: CreateUserInput): Promise<UserModel> {
       const db = this.getDb();
       const result = await db.insert(userTable).values(data).returning();
       return result[0];
   }
   ```

4. **Não exponha dados sensíveis**
   ```typescript
   // ✅ CERTO: Remove senha da resposta
   const { password, ...userWithoutPassword } = user;
   return userWithoutPassword;
   ```

5. **Trate erros específicos**
   ```typescript
   // ✅ CERTO: Trata cada tipo de erro
   catch (error) {
       if (error instanceof UserNotFoundError) return notFound(error);
       if (error instanceof UserAlreadyExistsError) return badRequest(error);
       throw error; // Erros inesperados viram 500
   }
   ```

### ❌ DON'T (Não Fazer)

1. **Lógica de negócio no Controller**
   ```typescript
   // ❌ ERRADO: Regra de negócio no controller
   async perform(req: HttpRequest): Promise<HttpResponse> {
       const exists = await this.repository.loadByEmail(req.email);
       if (exists) return badRequest(new Error("User exists"));
       // ...
   }
   ```

2. **Lógica de negócio no Repositório**
   ```typescript
   // ❌ ERRADO: Verificação de negócio no repositório
   async create(data: CreateUserInput): Promise<UserModel> {
       const exists = await this.loadByEmail(data.email);
       if (exists) throw new Error("Email exists");
       // ...
   }
   ```

3. **Use Case chamando outro Use Case diretamente**
   ```typescript
   // ❌ ERRADO: Use case chamando outro use case
   export const setupCreateUser: Setup = (repo) => async (input) => {
       const sendEmail = setupSendEmail(emailService);
       await sendEmail({ to: input.email }); // EVITE ISSO
       // ...
   };
   
   // ✅ CERTO: Componha no controller ou factory se necessário
   ```

4. **Retornar null/undefined sem motivo**
   ```typescript
   // ❌ ERRADO: Retorna undefined sem razão clara
   async loadById(id: number): Promise<UserModel | undefined> {
       // ... se não encontrar, retorna undefined
   }
   
   // ✅ CERTO: No Use Case, lance erro se deve existir
   const user = await repo.loadById(id);
   if (!user) throw new UserNotFoundError();
   ```

5. **Misturar concerns**
   ```typescript
   // ❌ ERRADO: HTTP concerns no domain
   export const setupCreateUser: Setup = (repo) => async (input) => {
       try {
           return await repo.create(input);
       } catch (error) {
           return { statusCode: 500, error }; // NÃO!
       }
   };
   ```

---

## 🎓 Entendendo o Fluxo

```
HTTP Request
    ↓
Express Route (user.ts)
    ↓
adaptExpressRoute (adapter)
    ↓
Factory (makeCreateUserController)
    ├─→ makePgUserRepository() → PgUserRepository
    ├─→ setupCreateUser(repo) → CreateUser use case
    ├─→ new CreateUserController(useCase)
    └─→ DbTransactionController(controller)
        ↓
Controller.handle()
    ├─→ buildValidators() → Valida entrada
    └─→ perform()
            ↓
        Use Case (CreateUser)
            ├─→ Verifica email existente
            ├─→ Hash da senha
            └─→ Cria usuário via repository
                    ↓
                Repository (PgUserRepository)
                    ├─→ getDb() → Drizzle
                    └─→ insert().values().returning()
                            ↓
                        PostgreSQL
                            ↓
                        Retorna user
                    ↓
                Use Case retorna (sem senha)
            ↓
        Controller retorna HTTP 201
    ↓
adaptExpressRoute formata resposta
    ↓
Express envia ao cliente
```

---

## 📚 Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Express.js Documentation](https://expressjs.com/)
- [Jest Testing Framework](https://jestjs.io/)

---

**Você está pronto para adicionar novas funcionalidades!** 🚀

Se tiver dúvidas, revise os exemplos existentes:
- `src/domain/use-cases/create-pokemon.ts`
- `src/application/controllers/pokemon/create-pokemon.ts`
- `src/infra/repos/postgres/pokemon-repository.ts`
- `src/main/factories/application/controllers/create-pokemon.ts`

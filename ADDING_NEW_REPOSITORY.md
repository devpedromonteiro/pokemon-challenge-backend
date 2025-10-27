# Adding a New Repository - Step by Step Guide

This guide demonstrates how to add a new repository following Clean Architecture principles.

## Example: Creating a User Repository

Let's create a complete User repository from scratch.

---

## Step 1: Create the Database Schema

**File:** `src/infra/repos/postgres/schemas/user.ts`

```typescript
import { integer, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * User table schema
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

**Update:** `src/infra/repos/postgres/schemas/index.ts`

```typescript
export * from "./pokemon";
export * from "./user";  // Add this line
```

---

## Step 2: Create Domain Contracts (Interfaces)

### Contract: Load User by ID

**File:** `src/domain/contracts/repos/load-user-by-id.ts`

```typescript
/**
 * Contract for loading a user by ID
 */
export interface LoadUserById {
  /**
   * Loads a user from the database by ID
   * @param input - The input containing the user ID
   * @returns Promise that resolves to the user data or undefined if not found
   */
  load: (input: LoadUserById.Input) => Promise<LoadUserById.Output>;
}

export namespace LoadUserById {
  export type Input = { id: number };
  export type Output =
    | {
        id: number;
        name: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
      }
    | undefined;
}
```

### Contract: Load User by Email

**File:** `src/domain/contracts/repos/load-user-by-email.ts`

```typescript
/**
 * Contract for loading a user by email
 */
export interface LoadUserByEmail {
  /**
   * Loads a user from the database by email
   * @param input - The input containing the user email
   * @returns Promise that resolves to the user data or undefined if not found
   */
  load: (input: LoadUserByEmail.Input) => Promise<LoadUserByEmail.Output>;
}

export namespace LoadUserByEmail {
  export type Input = { email: string };
  export type Output =
    | {
        id: number;
        name: string;
        email: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
      }
    | undefined;
}
```

### Contract: Save User

**File:** `src/domain/contracts/repos/save-user.ts`

```typescript
/**
 * Contract for saving a user to the database
 */
export interface SaveUser {
  /**
   * Saves a user to the database
   * @param input - The user data to save
   * @returns Promise that resolves to the saved user data
   */
  save: (input: SaveUser.Input) => Promise<SaveUser.Output>;
}

export namespace SaveUser {
  export type Input = {
    name: string;
    email: string;
    password: string;
  };
  export type Output = {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

**Update:** `src/domain/contracts/repos/index.ts`

```typescript
export * from "./load-pokemon";
export * from "./save-pokemon";
export * from "./load-user-by-id";     // Add these lines
export * from "./load-user-by-email";
export * from "./save-user";
```

---

## Step 3: Implement Repository

**File:** `src/infra/repos/postgres/user-repository.ts`

```typescript
import { eq } from "drizzle-orm";
import type {
  LoadUserById,
  LoadUserByEmail,
  SaveUser,
} from "../../../domain/contracts/repos";
import { PgRepository } from "./repository";
import { userTable } from "./schemas";

/**
 * PostgreSQL implementation of User repository
 * Implements LoadUserById, LoadUserByEmail, and SaveUser contracts
 */
export class PgUserRepository
  extends PgRepository
  implements LoadUserById, LoadUserByEmail, SaveUser
{
  /**
   * Loads a user from the database by ID
   * @param input - The input containing the user ID
   * @returns Promise that resolves to the user data or undefined if not found
   */
  async load({ id }: LoadUserById.Input): Promise<LoadUserById.Output> {
    const db = this.getDb();
    const result = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable)
      .where(eq(userTable.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * Loads a user from the database by email
   * @param input - The input containing the user email
   * @returns Promise that resolves to the user data or undefined if not found
   */
  async loadByEmail({
    email,
  }: LoadUserByEmail.Input): Promise<LoadUserByEmail.Output> {
    const db = this.getDb();
    const result = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    return result[0];
  }

  /**
   * Saves a user to the database
   * @param input - The user data to save
   * @returns Promise that resolves to the saved user data
   */
  async save(input: SaveUser.Input): Promise<SaveUser.Output> {
    const db = this.getDb();
    const result = await db
      .insert(userTable)
      .values({
        name: input.name,
        email: input.email,
        password: input.password,
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
}
```

**Update:** `src/infra/repos/postgres/index.ts`

```typescript
export * from "./helpers";
export * from "./pokemon-repository";
export * from "./user-repository";  // Add this line
export * from "./repository";
export * from "./schemas";
```

---

## Step 4: Create Factory

**File:** `src/main/factories/infra/repos/postgres/user-repository.ts`

```typescript
import { PgUserRepository } from "../../../../../infra/repos/postgres/user-repository";
import { makePgConnection } from "./helpers/connection";

/**
 * Factory function to create a PgUserRepository instance
 * @returns A new PgUserRepository instance
 */
export const makePgUserRepository = (): PgUserRepository => {
  return new PgUserRepository(makePgConnection());
};
```

**Update:** `src/main/factories/infra/repos/postgres/index.ts`

```typescript
export * from "./helpers/connection";
export * from "./pokemon-repository";
export * from "./user-repository";  // Add this line
```

---

## Step 5: Generate and Apply Migration

```bash
# Generate migration files
npm run db:generate

# Apply migrations (or use db:push for development)
npm run db:push
```

---

## Step 6: Write Tests

**File:** `tests/infra/repos/postgres/user-repository.spec.ts`

```typescript
import type {
  LoadUserById,
  LoadUserByEmail,
  SaveUser,
} from "../../../../src/domain/contracts/repos";

describe("PgUserRepository", () => {
  let sut: LoadUserById & LoadUserByEmail & SaveUser;

  beforeAll(() => {
    sut = {
      load: jest.fn(),
      loadByEmail: jest.fn(),
      save: jest.fn(),
    };
  });

  describe("load", () => {
    it("should load a user by id", async () => {
      const mockUser: LoadUserById.Output = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (sut.load as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await sut.load({ id: 1 });

      expect(result).toEqual(mockUser);
      expect(sut.load).toHaveBeenCalledWith({ id: 1 });
    });

    it("should return undefined when user is not found", async () => {
      (sut.load as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await sut.load({ id: 999 });

      expect(result).toBeUndefined();
    });
  });

  describe("loadByEmail", () => {
    it("should load a user by email", async () => {
      const mockUser: LoadUserByEmail.Output = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (sut.loadByEmail as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await sut.loadByEmail({ email: "john@example.com" });

      expect(result).toEqual(mockUser);
      expect(sut.loadByEmail).toHaveBeenCalledWith({
        email: "john@example.com",
      });
    });
  });

  describe("save", () => {
    it("should save a user", async () => {
      const input: SaveUser.Input = {
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword",
      };

      const mockOutput: SaveUser.Output = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (sut.save as jest.Mock).mockResolvedValueOnce(mockOutput);

      const result = await sut.save(input);

      expect(result).toEqual(mockOutput);
      expect(sut.save).toHaveBeenCalledWith(input);
    });
  });
});
```

Run tests:

```bash
npm test
```

---

## Step 7: Use in Your Application

### Example: In a Use Case

```typescript
import { makePgUserRepository } from '@/main/factories/infra/repos/postgres';

export class CreateUserUseCase {
  async execute(input: { name: string; email: string; password: string }) {
    const repository = makePgUserRepository();
    
    // Check if user already exists
    const existingUser = await repository.loadByEmail({ email: input.email });
    if (existingUser) {
      throw new Error("User already exists");
    }
    
    // Save new user
    const user = await repository.save({
      name: input.name,
      email: input.email,
      password: input.password, // Remember to hash the password!
    });
    
    return user;
  }
}
```

### Example: In a Controller

```typescript
import { makePgUserRepository } from '@/main/factories/infra/repos/postgres';

export class GetUserController {
  async handle(request: { userId: number }) {
    const repository = makePgUserRepository();
    
    const user = await repository.load({ id: request.userId });
    
    if (!user) {
      return { statusCode: 404, body: { error: "User not found" } };
    }
    
    return { statusCode: 200, body: user };
  }
}
```

### Example: With Transaction

```typescript
import { makePgConnection, makePgUserRepository } from '@/main/factories/infra/repos/postgres';

export class CreateUserWithProfileUseCase {
  async execute(input: { name: string; email: string; password: string }) {
    const connection = makePgConnection();
    const userRepository = makePgUserRepository();
    
    try {
      await connection.openTransaction();
      
      // Create user
      const user = await userRepository.save({
        name: input.name,
        email: input.email,
        password: input.password,
      });
      
      // Create profile (assuming you have a profile repository)
      // await profileRepository.save({ userId: user.id, ... });
      
      await connection.commit();
      return user;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.closeTransaction();
    }
  }
}
```

---

## Quick Checklist

When adding a new repository, make sure to:

- [ ] Create database schema in `src/infra/repos/postgres/schemas/`
- [ ] Export schema from `schemas/index.ts`
- [ ] Create domain contracts in `src/domain/contracts/repos/`
- [ ] Export contracts from `repos/index.ts`
- [ ] Implement repository extending `PgRepository`
- [ ] Export repository from `postgres/index.ts`
- [ ] Create factory in `src/main/factories/`
- [ ] Export factory from `factories/.../index.ts`
- [ ] Write unit tests
- [ ] Generate and apply migrations
- [ ] Run tests to verify
- [ ] Update documentation if needed

---

## Common Patterns

### Update Operations

```typescript
async update(input: UpdateUser.Input): Promise<UpdateUser.Output> {
  const db = this.getDb();
  const result = await db
    .update(userTable)
    .set({ 
      name: input.name,
      updatedAt: new Date() 
    })
    .where(eq(userTable.id, input.id))
    .returning();
  
  return result[0];
}
```

### Delete Operations

```typescript
async delete(input: DeleteUser.Input): Promise<void> {
  const db = this.getDb();
  await db
    .delete(userTable)
    .where(eq(userTable.id, input.id));
}
```

### List Operations with Pagination

```typescript
async list(input: ListUsers.Input): Promise<ListUsers.Output> {
  const db = this.getDb();
  const { page = 1, limit = 10 } = input;
  const offset = (page - 1) * limit;
  
  const users = await db
    .select()
    .from(userTable)
    .limit(limit)
    .offset(offset);
  
  return users;
}
```

### Complex Queries with Joins

```typescript
async loadWithProfile(input: LoadUserWithProfile.Input): Promise<LoadUserWithProfile.Output> {
  const db = this.getDb();
  const result = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      profile: {
        bio: profileTable.bio,
        avatar: profileTable.avatar,
      },
    })
    .from(userTable)
    .leftJoin(profileTable, eq(userTable.id, profileTable.userId))
    .where(eq(userTable.id, input.id))
    .limit(1);
  
  return result[0];
}
```

---

## Best Practices

1. ✅ **Keep contracts simple** - One method per interface when possible
2. ✅ **Use namespaces** - Group Input/Output types with the interface
3. ✅ **Return undefined** - For "not found" cases instead of throwing
4. ✅ **Use transactions** - For operations that modify multiple entities
5. ✅ **Test with mocks** - Use interface types for easy mocking
6. ✅ **Document everything** - Add TypeDoc comments to all public methods
7. ✅ **Follow naming conventions** - Prefix PostgreSQL implementations with `Pg`
8. ✅ **Keep queries efficient** - Use `.limit(1)` for single-record queries
9. ✅ **Handle dates properly** - PostgreSQL timestamp types work with Date objects
10. ✅ **Use selective fields** - Don't return sensitive data (like passwords) unless needed

---

## Troubleshooting

### Issue: "Cannot find module"

- Make sure you exported from all `index.ts` files
- Check import paths are correct

### Issue: "Type error in repository"

- Verify your schema types match your contract types
- Use Drizzle's type inference: `typeof table.$inferSelect`

### Issue: "Migration fails"

- Check for syntax errors in schema
- Verify foreign key constraints
- Ensure unique constraints are properly defined

---

**You're now ready to add new repositories!** 🎉


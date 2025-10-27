# Quick Start Guide - Database Layer

## 🚀 Setup

### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pokemon_db
```

### 2. Start PostgreSQL

Using Docker:

```bash
docker run -d \
  --name pokemon-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pokemon_db \
  -p 5432:5432 \
  postgres:16-alpine
```

Or using docker-compose (if you have a docker-compose.yml):

```bash
docker-compose up -d postgres
```

### 3. Generate and Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Push schema directly to database (development)
npm run db:push
```

### 4. Start the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 📚 Basic Usage

### Using Transactions

```typescript
import { makePgConnection } from '@/main/factories/infra/repos/postgres';
import { makePgPokemonRepository } from '@/main/factories/infra/repos/postgres';

const connection = makePgConnection();
const repository = makePgPokemonRepository();

try {
  await connection.openTransaction();
  
  await repository.save({ id: 1, name: "Bulbasaur" });
  await repository.save({ id: 2, name: "Ivysaur" });
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.closeTransaction();
}
```

## 🧪 Testing

Run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:push` | Push schema to database (dev) |
| `npm run db:studio` | Open Drizzle Studio (GUI) |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format code with Biome |

## 🎯 Key Features

✅ **Clean Architecture** - Separation of concerns with clear boundaries  
✅ **SOLID Principles** - Dependency inversion and interface segregation  
✅ **Type Safety** - Full TypeScript support with Drizzle ORM  
✅ **Transaction Support** - Built-in transaction management  
✅ **Singleton Pattern** - Efficient connection pooling  
✅ **Easy Testing** - Mock-friendly interfaces  
✅ **100% Test Coverage** - Comprehensive test suite  

## 🔧 Troubleshooting

### Connection Issues

If you get `ConnectionNotFoundError`:
- Make sure PostgreSQL is running
- Check your `.env` configuration
- Verify the server is calling `connect()` on startup

### Transaction Issues

If you get `TransactionNotFoundError`:
- Ensure you call `openTransaction()` before transaction operations
- Always call `closeTransaction()` in a `finally` block

### Migration Issues

If migrations fail:
- Check database credentials
- Ensure PostgreSQL is running
- Verify schema syntax in `src/infra/repos/postgres/schemas/`

## 📖 Next Steps

1. **Add More Repositories**: Follow the pattern in `pokemon-repository.ts`
2. **Create Use Cases**: Implement business logic using repository contracts
3. **Add Controllers**: Create HTTP endpoints using Express
4. **Setup Validation**: Add input validation with Zod or similar
5. **Add Authentication**: Implement JWT or session-based auth

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 🤝 Contributing

When adding new features:
1. Create domain contracts first (interfaces)
2. Implement in infrastructure layer
3. Create factories for dependency injection
4. Write tests (aim for 100% coverage)
5. Update documentation

---

**Happy Coding!** 🎉


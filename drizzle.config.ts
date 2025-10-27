import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration for migrations and schema management
 */
export default {
    schema: "./src/infra/repos/postgres/schemas/index.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "pokemon_db",
    },
} satisfies Config;

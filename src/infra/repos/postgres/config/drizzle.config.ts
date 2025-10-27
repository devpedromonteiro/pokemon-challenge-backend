import type { Config } from "drizzle-kit";
import { env } from "../../../../main/config/env";

/**
 * Drizzle configuration for database migrations and schema management
 */
export default {
    schema: "./src/infra/repos/postgres/schemas/index.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database,
    },
} satisfies Config;

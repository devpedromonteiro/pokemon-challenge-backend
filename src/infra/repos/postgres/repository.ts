import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgConnection } from "./helpers/connection";
import type * as schema from "./schemas";

/**
 * Abstract base class for PostgreSQL repositories
 * Provides access to the Drizzle database instance through PgConnection
 */
export abstract class PgRepository {
    /**
     * Creates a new PgRepository instance
     * @param connection - The PostgreSQL connection manager
     */
    constructor(private readonly connection: PgConnection) {}

    /**
     * Gets the Drizzle database instance
     * If a transaction is active, returns the transaction instance
     * Otherwise returns the main database instance
     * @returns The Drizzle database instance
     */
    protected getDb(): NodePgDatabase<typeof schema> {
        return this.connection.getDb();
    }
}

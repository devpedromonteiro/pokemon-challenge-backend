import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import type { DbTransaction } from "../../../../application/contracts";
import { env } from "../../../../main/config/env";
import * as schema from "../schemas";
import { ConnectionNotFoundError, TransactionNotFoundError } from "./errors";

/**
 * PostgreSQL connection manager using Singleton pattern
 * Manages database connections and transactions using Drizzle ORM
 */
export class PgConnection implements DbTransaction {
    private static instance?: PgConnection;
    private pool?: Pool;
    private client?: PoolClient;
    private db?: NodePgDatabase<typeof schema>;
    private transactionDb?: NodePgDatabase<typeof schema>;

    /**
     * Private constructor to enforce Singleton pattern
     */
    private constructor() {}

    /**
     * Gets the singleton instance of PgConnection
     * @returns The PgConnection instance
     */
    static getInstance(): PgConnection {
        if (!PgConnection.instance) {
            PgConnection.instance = new PgConnection();
        }
        return PgConnection.instance;
    }

    /**
     * Establishes connection to PostgreSQL database
     * @returns Promise that resolves when connection is established
     */
    async connect(): Promise<void> {
        this.pool = new Pool({
            host: env.db.host,
            port: env.db.port,
            user: env.db.user,
            password: env.db.password,
            database: env.db.database,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: env.nodeEnv === "production" ? true : false,
        });

        const client = await this.pool.connect();
        client.release();

        this.db = drizzle(this.pool, { schema });
    }

    /**
     * Closes connection to PostgreSQL database
     * @returns Promise that resolves when connection is closed
     */
    async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = undefined;
            this.db = undefined;
        }
        this.closeTransaction();
    }

    /**
     * Opens a new database transaction
     * @throws {ConnectionNotFoundError} If database is not connected
     * @returns Promise that resolves when transaction is opened
     */
    async openTransaction(): Promise<void> {
        if (!this.pool) {
            throw new ConnectionNotFoundError();
        }
        this.client = await this.pool.connect();
        await this.client.query("BEGIN");
        this.transactionDb = drizzle(this.client, { schema });
    }

    /**
     * Closes the current database transaction
     * @returns Promise that resolves when transaction is closed
     */
    async closeTransaction(): Promise<void> {
        if (this.client) {
            this.client.release();
            this.client = undefined;
            this.transactionDb = undefined;
        }
    }

    /**
     * Commits the current database transaction
     * @throws {TransactionNotFoundError} If no transaction is active
     * @returns Promise that resolves when transaction is committed
     */
    async commit(): Promise<void> {
        if (!this.client) {
            throw new TransactionNotFoundError();
        }
        await this.client.query("COMMIT");
    }

    /**
     * Rolls back the current database transaction
     * @throws {TransactionNotFoundError} If no transaction is active
     * @returns Promise that resolves when transaction is rolled back
     */
    async rollback(): Promise<void> {
        if (!this.client) {
            throw new TransactionNotFoundError();
        }
        await this.client.query("ROLLBACK");
    }

    /**
     * Gets the Drizzle database instance
     * If a transaction is active, returns the transaction instance
     * Otherwise returns the main database instance
     * @throws {ConnectionNotFoundError} If database is not connected
     * @returns The Drizzle database instance
     */
    getDb(): NodePgDatabase<typeof schema> {
        if (this.transactionDb) {
            return this.transactionDb;
        }
        if (!this.db) {
            throw new ConnectionNotFoundError();
        }
        return this.db;
    }
}

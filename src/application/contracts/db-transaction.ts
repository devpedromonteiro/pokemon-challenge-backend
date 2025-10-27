/**
 * Database transaction contract
 * Defines the interface for database transaction management
 */
export interface DbTransaction {
    /**
     * Opens a new database transaction
     * @returns Promise that resolves when transaction is opened
     */
    openTransaction: () => Promise<void>;

    /**
     * Closes the current database transaction
     * @returns Promise that resolves when transaction is closed
     */
    closeTransaction: () => Promise<void>;

    /**
     * Commits the current database transaction
     * @returns Promise that resolves when transaction is committed
     */
    commit: () => Promise<void>;

    /**
     * Rolls back the current database transaction
     * @returns Promise that resolves when transaction is rolled back
     */
    rollback: () => Promise<void>;
}

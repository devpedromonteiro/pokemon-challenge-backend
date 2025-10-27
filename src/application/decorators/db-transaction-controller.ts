import type { DbTransaction } from "../contracts";
import type { Controller } from "../controller";

/**
 * Decorator that wraps a controller to execute within a database transaction
 * Automatically commits on success or rolls back on error
 */
export class DbTransactionController implements Controller {
    /**
     * Creates a new DbTransactionController
     *
     * @param decoratee - The controller to be decorated
     * @param db - The database transaction manager
     */
    constructor(
        private readonly decoratee: Controller,
        private readonly db: DbTransaction,
    ) {}

    /**
     * Handles the request within a database transaction
     *
     * Commits the transaction on success, rolls back on error
     *
     * @param request - The request object to pass to the decorated controller
     * @returns Promise that resolves to the controller's response
     * @throws Will throw the original error after rolling back the transaction
     */
    async perform(request: any): Promise<any> {
        await this.db.openTransaction();
        try {
            const response = await this.decoratee.perform(request);

            await this.db.commit();

            return response;
        } catch (error) {
            await this.db.rollback();

            throw error;
        } finally {
            await this.db.closeTransaction();
        }
    }
}

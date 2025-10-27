import { CustomError } from "../../../../domain/custom-error";

/**
 * Error thrown when attempting to use database connection before it's established
 */
export class ConnectionNotFoundError extends CustomError<"CONNECTION_NOT_FOUND"> {
    constructor() {
        super({
            message: "No connection found. Did you call connect()?",
            statusCode: 500,
            code: "CONNECTION_NOT_FOUND",
        });
        this.name = "ConnectionNotFoundError";
    }
}

/**
 * Error thrown when attempting to use transaction methods without an active transaction
 */
export class TransactionNotFoundError extends CustomError<"TRANSACTION_NOT_FOUND"> {
    constructor() {
        super({
            message: "No transaction found. Did you call openTransaction()?",
            statusCode: 500,
            code: "TRANSACTION_NOT_FOUND",
        });
        this.name = "TransactionNotFoundError";
    }
}

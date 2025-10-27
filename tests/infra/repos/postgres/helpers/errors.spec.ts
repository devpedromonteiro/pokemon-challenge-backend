import {
    ConnectionNotFoundError,
    TransactionNotFoundError,
} from "../../../../../src/infra/repos/postgres/helpers/errors";

describe("Database Errors", () => {
    describe("ConnectionNotFoundError", () => {
        it("should create an error with correct message", () => {
            const error = new ConnectionNotFoundError();

            expect(error.message).toBe("No connection found. Did you call connect()?");
            expect(error.name).toBe("ConnectionNotFoundError");
            expect(error).toBeInstanceOf(Error);
        });

        it("should be throwable", () => {
            expect(() => {
                throw new ConnectionNotFoundError();
            }).toThrow(ConnectionNotFoundError);
        });

        it("should be catchable as Error", () => {
            try {
                throw new ConnectionNotFoundError();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(ConnectionNotFoundError);
            }
        });
    });

    describe("TransactionNotFoundError", () => {
        it("should create an error with correct message", () => {
            const error = new TransactionNotFoundError();

            expect(error.message).toBe("No transaction found. Did you call openTransaction()?");
            expect(error.name).toBe("TransactionNotFoundError");
            expect(error).toBeInstanceOf(Error);
        });

        it("should be throwable", () => {
            expect(() => {
                throw new TransactionNotFoundError();
            }).toThrow(TransactionNotFoundError);
        });

        it("should be catchable as Error", () => {
            try {
                throw new TransactionNotFoundError();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(TransactionNotFoundError);
            }
        });
    });
});

export class CustomError<T extends string> extends Error {
    message: string;
    statusCode: number;
    code?: T;

    constructor({
        message,
        statusCode,
        code,
    }: {
        message: string;
        statusCode: number;
        code?: T;
    }) {
        super();
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
    }
}

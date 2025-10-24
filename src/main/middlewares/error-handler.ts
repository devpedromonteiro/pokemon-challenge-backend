import { NextFunction, Request, Response } from "express";
import { CustomError } from "../../domain/custom-error";
import { env } from "../config/env";

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    if (error && typeof error === "object" && "message" in error) {
        return String(error.message);
    }

    if (typeof error === "string") {
        return error;
    }

    return "An error occurred";
};

export const errorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (res.headersSent || env.debug) {
        next(error);
        return;
    }

    if (error instanceof CustomError) {
        res.status(error.statusCode).json({
            error: {
                message: error.message,
                code: error.code,
            },
        });
        return;
    }

    res.status(500).json({
        error: {
            message:
                getErrorMessage(error) ||
                "An error occurred. Please view logs for more details",
        },
    });
};

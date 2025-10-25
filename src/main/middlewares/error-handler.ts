import type { NextFunction, Request, Response } from "express";
import { CustomError } from "@/domain/custom-error";
import { env } from "@/main/config/env";
import { getErrorMessage } from "@/main/utils/get-error-message";

/**
 * Handle errors in the request pipeline.
 *
 * @param error - The error to handle.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 *
 * @returns void
 */
export const errorHandler = (error: unknown, _req: Request, res: Response, next: NextFunction) => {
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
                getErrorMessage(error) || "An error occurred. Please view logs for more details",
        },
    });
};

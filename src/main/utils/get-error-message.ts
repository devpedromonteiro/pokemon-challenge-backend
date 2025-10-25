/**
 * Get a safe error message from any type of value.
 * Never throws an exception.
 *
 * @param error - The error to extract the message from.
 * @returns The error message as a string.
 */
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && typeof error.message === "string") {
        return error.message;
    }

    if (
        error !== null &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }

    try {
        return String(error);
    } catch {
        return "Unknown error";
    }
};

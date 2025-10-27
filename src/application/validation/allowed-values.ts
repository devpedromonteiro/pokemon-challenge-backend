import { ValidationError } from "@/application/errors";
import type { Validator } from "@/application/validation";

/**
 * Validator for checking if a value is within allowed values
 */
export class AllowedValues implements Validator {
    constructor(
        private readonly value: any,
        private readonly allowedValues: any[],
        private readonly fieldName?: string,
    ) {}

    validate(): Error | undefined {
        // Skip validation if value is null or undefined (let Required validator handle it)
        if (this.value === null || this.value === undefined) {
            return undefined;
        }

        if (!this.allowedValues.includes(this.value)) {
            const allowed = this.allowedValues.map((v) => `"${v}"`).join(", ");
            const field = this.fieldName ?? "field";
            return new ValidationError(`${field} must be one of: ${allowed}`);
        }
    }
}

/**
 * Validator for checking if a forbidden field is present
 */
export class ForbiddenField implements Validator {
    constructor(
        private readonly value: any,
        private readonly fieldName: string,
    ) {}

    validate(): Error | undefined {
        if (this.value !== undefined && this.value !== null) {
            return new ValidationError(`${this.fieldName} should not be provided`);
        }
    }
}

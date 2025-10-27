import { PgConnection } from "@/infra/repos/postgres/helpers/connection";

/**
 * Factory function to get the PgConnection singleton instance
 * @returns The PgConnection singleton instance
 */
export const makePgConnection = (): PgConnection => {
    return PgConnection.getInstance();
};

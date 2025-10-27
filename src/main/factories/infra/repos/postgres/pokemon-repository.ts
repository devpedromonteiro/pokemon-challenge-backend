import { PgPokemonRepository } from "../../../../../infra/repos/postgres/pokemon-repository";
import { makePgConnection } from "./helpers/connection";

/**
 * Factory function to create a PgPokemonRepository instance
 * @returns A new PgPokemonRepository instance
 */
export const makePgPokemonRepository = (): PgPokemonRepository => {
    return new PgPokemonRepository(makePgConnection());
};

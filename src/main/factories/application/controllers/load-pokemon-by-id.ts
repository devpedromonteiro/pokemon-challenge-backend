import { LoadPokemonByIdController } from "@/application/controllers/pokemon";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create a LoadPokemonByIdController
 * @returns LoadPokemonByIdController instance
 */
export const makeLoadPokemonByIdController = (): LoadPokemonByIdController => {
    const repository = makePgPokemonRepository();
    return new LoadPokemonByIdController(repository);
};

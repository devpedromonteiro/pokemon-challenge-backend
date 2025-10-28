import { LoadPokemonByIdController } from "@/application/controllers/pokemon";
import { setupLoadPokemonById } from "@/domain/use-cases";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create a LoadPokemonByIdController with use case injection
 * @returns LoadPokemonByIdController instance
 */
export const makeLoadPokemonByIdController = (): LoadPokemonByIdController => {
    const repository = makePgPokemonRepository();
    const loadPokemonById = setupLoadPokemonById(repository);
    return new LoadPokemonByIdController(loadPokemonById);
};

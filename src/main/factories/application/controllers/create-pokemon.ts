import { CreatePokemonController } from "@/application/controllers/pokemon";
import { DbTransactionController } from "@/application/decorators";
import { setupCreatePokemon } from "@/domain/use-cases";
import { makePgConnection } from "@/main/factories/infra/repos/postgres";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create a CreatePokemonController with use case injection
 * @returns CreatePokemonController wrapped with DbTransactionController
 */
export const makeCreatePokemonController = (): DbTransactionController => {
    const repository = makePgPokemonRepository();
    const createPokemon = setupCreatePokemon(repository);
    const controller = new CreatePokemonController(createPokemon);
    return new DbTransactionController(controller, makePgConnection());
};

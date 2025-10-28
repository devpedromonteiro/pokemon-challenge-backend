import { DeletePokemonController } from "@/application/controllers/pokemon";
import { DbTransactionController } from "@/application/decorators";
import { setupDeletePokemon } from "@/domain/use-cases";
import { makePgConnection } from "@/main/factories/infra/repos/postgres";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create a DeletePokemonController with use case injection
 * @returns DeletePokemonController wrapped with DbTransactionController
 */
export const makeDeletePokemonController = (): DbTransactionController => {
    const repository = makePgPokemonRepository();
    const deletePokemon = setupDeletePokemon(repository);
    const controller = new DeletePokemonController(deletePokemon);
    return new DbTransactionController(controller, makePgConnection());
};

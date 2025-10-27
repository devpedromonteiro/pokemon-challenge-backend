import { CreatePokemonController } from "@/application/controllers/pokemon";
import { DbTransactionController } from "@/application/decorators";
import { makePgConnection } from "@/main/factories/infra/repos/postgres";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create a CreatePokemonController with transaction support
 * @returns CreatePokemonController wrapped with DbTransactionController
 */
export const makeCreatePokemonController = (): DbTransactionController => {
    const repository = makePgPokemonRepository();
    const controller = new CreatePokemonController(repository);
    return new DbTransactionController(controller, makePgConnection());
};

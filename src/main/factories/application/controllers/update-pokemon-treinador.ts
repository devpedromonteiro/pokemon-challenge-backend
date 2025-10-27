import { UpdatePokemonTreinadorController } from "@/application/controllers/pokemon";
import { DbTransactionController } from "@/application/decorators";
import { makePgConnection } from "@/main/factories/infra/repos/postgres";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create an UpdatePokemonTreinadorController with transaction support
 * @returns UpdatePokemonTreinadorController wrapped with DbTransactionController
 */
export const makeUpdatePokemonTreinadorController = (): DbTransactionController => {
    const repository = makePgPokemonRepository();
    const controller = new UpdatePokemonTreinadorController(repository);
    return new DbTransactionController(controller, makePgConnection());
};

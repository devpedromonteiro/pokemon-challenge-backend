import { UpdatePokemonTreinadorController } from "@/application/controllers/pokemon";
import { DbTransactionController } from "@/application/decorators";
import { setupUpdatePokemonTreinador } from "@/domain/use-cases";
import { makePgConnection } from "@/main/factories/infra/repos/postgres";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create an UpdatePokemonTreinadorController with use case injection
 * @returns UpdatePokemonTreinadorController wrapped with DbTransactionController
 */
export const makeUpdatePokemonTreinadorController = (): DbTransactionController => {
    const repository = makePgPokemonRepository();
    const updatePokemonTreinador = setupUpdatePokemonTreinador(repository);
    const controller = new UpdatePokemonTreinadorController(updatePokemonTreinador);
    return new DbTransactionController(controller, makePgConnection());
};

import { BattlePokemonController } from "@/application/controllers/battle";
import { DbTransactionController } from "@/application/decorators";
import { setupBattlePokemon } from "@/domain/use-cases";
import { makePgConnection } from "@/main/factories/infra/repos/postgres";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create a BattlePokemonController with use case injection
 * @returns BattlePokemonController wrapped with DbTransactionController
 */
export const makeBattlePokemonController = (): DbTransactionController => {
    const repository = makePgPokemonRepository();
    const battlePokemon = setupBattlePokemon(repository);
    const controller = new BattlePokemonController(battlePokemon);
    return new DbTransactionController(controller, makePgConnection());
};

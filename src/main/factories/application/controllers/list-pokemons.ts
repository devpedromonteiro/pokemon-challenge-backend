import { ListPokemonsController } from "@/application/controllers/pokemon";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create a ListPokemonsController
 * @returns ListPokemonsController instance
 */
export const makeListPokemonsController = (): ListPokemonsController => {
    const repository = makePgPokemonRepository();
    return new ListPokemonsController(repository);
};

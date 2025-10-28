import { ListPokemonsController } from "@/application/controllers/pokemon";
import { setupListPokemons } from "@/domain/use-cases";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

/**
 * Factory function to create a ListPokemonsController with use case injection
 * @returns ListPokemonsController instance
 */
export const makeListPokemonsController = (): ListPokemonsController => {
    const repository = makePgPokemonRepository();
    const listPokemons = setupListPokemons(repository);
    return new ListPokemonsController(listPokemons);
};

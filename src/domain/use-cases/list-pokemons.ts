import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";

type Setup = (pokemonRepository: PokemonRepository) => ListPokemons;
type Output = PokemonModel[];
export type ListPokemons = () => Promise<Output>;

/**
 * Setup function for ListPokemons use case
 * @param pokemonRepository - Pokemon repository instance
 * @returns ListPokemons use case function
 */
export const setupListPokemons: Setup = (pokemonRepository) => async () => {
    return await pokemonRepository.listAll();
};

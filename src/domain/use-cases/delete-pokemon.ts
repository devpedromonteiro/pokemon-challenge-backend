import type { PokemonRepository } from "@/domain/contracts/repos";

type Setup = (pokemonRepository: PokemonRepository) => DeletePokemon;
type Input = { id: number };

export type DeletePokemon = (input: Input) => Promise<void>;

/**
 * Setup function for DeletePokemon use case
 * @param pokemonRepository - Pokemon repository instance
 * @returns DeletePokemon use case function
 */
export const setupDeletePokemon: Setup =
    (pokemonRepository) =>
    async ({ id }) => {
        const pokemon = await pokemonRepository.loadById(id);

        if (!pokemon) {
            throw new Error("Pokemon not found");
        }

        await pokemonRepository.deleteById(id);
    };

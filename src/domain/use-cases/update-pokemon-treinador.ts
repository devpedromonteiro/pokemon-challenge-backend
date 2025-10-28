import type { PokemonRepository } from "@/domain/contracts/repos";

type Setup = (pokemonRepository: PokemonRepository) => UpdatePokemonTreinador;
type Input = { id: number; treinador: string };

export type UpdatePokemonTreinador = (input: Input) => Promise<void>;

/**
 * Setup function for UpdatePokemonTreinador use case
 * @param pokemonRepository - Pokemon repository instance
 * @returns UpdatePokemonTreinador use case function
 */
export const setupUpdatePokemonTreinador: Setup =
    (pokemonRepository) =>
    async ({ id, treinador }) => {
        const pokemon = await pokemonRepository.loadById(id);

        if (!pokemon) {
            throw new Error("Pokemon not found");
        }

        await pokemonRepository.updateTreinador(id, treinador);
    };

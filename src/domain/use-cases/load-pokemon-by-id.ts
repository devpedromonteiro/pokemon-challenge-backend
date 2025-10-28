import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";

type Setup = (pokemonRepository: PokemonRepository) => LoadPokemonById;
type Input = { id: number };
type Output = PokemonModel | null;
export type LoadPokemonById = (input: Input) => Promise<Output>;

/**
 * Setup function for LoadPokemonById use case
 * @param pokemonRepository - Pokemon repository instance
 * @returns LoadPokemonById use case function
 */
export const setupLoadPokemonById: Setup =
    (pokemonRepository) =>
    async ({ id }) => {
        return await pokemonRepository.loadById(id);
    };

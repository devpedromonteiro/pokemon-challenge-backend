import type {
    CreatePokemonParams,
    PokemonModel,
    PokemonRepository,
} from "@/domain/contracts/repos";

type Setup = (pokemonRepository: PokemonRepository) => CreatePokemon;
type Input = { tipo: "pikachu" | "charizard" | "mewtwo"; treinador: string };
type Output = PokemonModel;

export type CreatePokemon = (input: Input) => Promise<Output>;

/**
 * Setup function for CreatePokemon use case
 * @param pokemonRepository - Pokemon repository instance
 * @returns CreatePokemon use case function
 */
export const setupCreatePokemon: Setup =
    (pokemonRepository) =>
    async ({ tipo, treinador }) => {
        const params: CreatePokemonParams = {
            tipo,
            treinador,
        };

        const pokemon = await pokemonRepository.create(params);

        return pokemon;
    };

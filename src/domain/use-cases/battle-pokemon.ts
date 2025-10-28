import { pickWinnerWeighted } from "@/domain/battle/pick-winner-weighted";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";

type Setup = (pokemonRepository: PokemonRepository) => BattlePokemon;
type Input = { pokemonAId: number; pokemonBId: number };
type Output = {
    vencedor: PokemonModel;
    perdedor: PokemonModel;
};
export type BattlePokemon = (input: Input) => Promise<Output>;

/**
 * Setup function for BattlePokemon use case
 * @param pokemonRepository - Pokemon repository instance
 * @returns BattlePokemon use case function
 */
export const setupBattlePokemon: Setup =
    (pokemonRepository) =>
    async ({ pokemonAId, pokemonBId }) => {
        // Load both pokemons
        const [pokemonA, pokemonB] = await Promise.all([
            pokemonRepository.loadById(pokemonAId),
            pokemonRepository.loadById(pokemonBId),
        ]);

        // Validate existence
        if (!pokemonA || !pokemonB) {
            throw new Error("Pokemon not found");
        }

        // Validate different pokemons
        if (pokemonAId === pokemonBId) {
            throw new Error("Cannot battle the same pokemon");
        }

        // Decide winner using weighted probability
        const { winner, loser } = pickWinnerWeighted(pokemonA, pokemonB);

        // Update levels
        const newWinnerLevel = winner.nivel + 1;
        const newLoserLevel = loser.nivel - 1;

        // Update winner level
        await pokemonRepository.updateNivel(winner.id, newWinnerLevel);

        // Handle loser: delete if level reaches 0, otherwise update
        if (newLoserLevel === 0) {
            await pokemonRepository.deleteById(loser.id);
        } else {
            await pokemonRepository.updateNivel(loser.id, newLoserLevel);
        }

        // Return updated pokemons
        return {
            vencedor: { ...winner, nivel: newWinnerLevel },
            perdedor: { ...loser, nivel: newLoserLevel },
        };
    };

import type { PokemonModel } from "@/domain/contracts/repos";

export type BattleResult = {
    winner: PokemonModel;
    loser: PokemonModel;
};

/**
 * Decides battle winner based on weighted probability by level
 * Probability of A winning = levelA / (levelA + levelB)
 * @param pokemonA - First pokemon
 * @param pokemonB - Second pokemon
 * @returns Object with winner and loser
 */
export const pickWinnerWeighted = (
    pokemonA: PokemonModel,
    pokemonB: PokemonModel,
): BattleResult => {
    const totalLevel = pokemonA.nivel + pokemonB.nivel;
    const pokemonAProbability = pokemonA.nivel / totalLevel;
    const randomValue = Math.random();

    if (randomValue < pokemonAProbability) {
        return { winner: pokemonA, loser: pokemonB };
    }

    return { winner: pokemonB, loser: pokemonA };
};

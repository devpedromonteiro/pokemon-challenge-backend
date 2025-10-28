import { pickWinnerWeighted } from "@/domain/battle/pick-winner-weighted";
import type { PokemonModel } from "@/domain/contracts/repos";

describe("pickWinnerWeighted", () => {
    const pokemonA: PokemonModel = {
        id: 1,
        tipo: "pikachu",
        treinador: "Ash",
        nivel: 1,
    };

    const pokemonB: PokemonModel = {
        id: 2,
        tipo: "charizard",
        treinador: "Red",
        nivel: 2,
    };

    it("should return winner and loser", () => {
        const result = pickWinnerWeighted(pokemonA, pokemonB);

        expect(result).toHaveProperty("winner");
        expect(result).toHaveProperty("loser");
        expect(result.winner).toHaveProperty("id");
        expect(result.loser).toHaveProperty("id");
    });

    it("should return one of the pokemons as winner", () => {
        const result = pickWinnerWeighted(pokemonA, pokemonB);

        const isValidWinner = result.winner.id === pokemonA.id || result.winner.id === pokemonB.id;
        expect(isValidWinner).toBe(true);
    });

    it("should return the other pokemon as loser", () => {
        const result = pickWinnerWeighted(pokemonA, pokemonB);

        expect(result.winner.id).not.toBe(result.loser.id);
    });

    it("should have higher probability for pokemon with higher level", () => {
        const pokemonWeakest: PokemonModel = { ...pokemonA, nivel: 1 };
        const pokemonStrongest: PokemonModel = { ...pokemonB, nivel: 99 };

        const wins = { weakest: 0, strongest: 0 };
        const battles = 1000;

        for (let i = 0; i < battles; i++) {
            const result = pickWinnerWeighted(pokemonWeakest, pokemonStrongest);
            if (result.winner.id === pokemonWeakest.id) {
                wins.weakest++;
            } else {
                wins.strongest++;
            }
        }

        // Strongest should win significantly more (expected ~99%)
        expect(wins.strongest).toBeGreaterThan(wins.weakest);
        expect(wins.strongest).toBeGreaterThan(battles * 0.9); // At least 90%
    });

    it("should have ~50% probability for pokemons with equal levels", () => {
        const pokemonEqual1: PokemonModel = { ...pokemonA, nivel: 5 };
        const pokemonEqual2: PokemonModel = { ...pokemonB, nivel: 5 };

        const wins = { pokemon1: 0, pokemon2: 0 };
        const battles = 1000;

        for (let i = 0; i < battles; i++) {
            const result = pickWinnerWeighted(pokemonEqual1, pokemonEqual2);
            if (result.winner.id === pokemonEqual1.id) {
                wins.pokemon1++;
            } else {
                wins.pokemon2++;
            }
        }

        // Both should win around 50% (allowing 40-60% variance for randomness)
        expect(wins.pokemon1).toBeGreaterThan(battles * 0.4);
        expect(wins.pokemon1).toBeLessThan(battles * 0.6);
        expect(wins.pokemon2).toBeGreaterThan(battles * 0.4);
        expect(wins.pokemon2).toBeLessThan(battles * 0.6);
    });

    it("should respect probability distribution (2:1 ratio)", () => {
        const pokemonLevel1: PokemonModel = { ...pokemonA, nivel: 1 };
        const pokemonLevel2: PokemonModel = { ...pokemonB, nivel: 2 };

        const wins = { level1: 0, level2: 0 };
        const battles = 3000;

        for (let i = 0; i < battles; i++) {
            const result = pickWinnerWeighted(pokemonLevel1, pokemonLevel2);
            if (result.winner.id === pokemonLevel1.id) {
                wins.level1++;
            } else {
                wins.level2++;
            }
        }

        // Level 2 should win ~66% (2/3), Level 1 ~33% (1/3)
        // Allowing variance: Level 2 should be between 60-72%, Level 1 between 28-40%
        expect(wins.level2).toBeGreaterThan(battles * 0.6);
        expect(wins.level2).toBeLessThan(battles * 0.72);
        expect(wins.level1).toBeGreaterThan(battles * 0.28);
        expect(wins.level1).toBeLessThan(battles * 0.4);
    });

    it("should work with level 1 vs level 1", () => {
        const pokemon1: PokemonModel = { ...pokemonA, nivel: 1 };
        const pokemon2: PokemonModel = { ...pokemonB, nivel: 1 };

        const result = pickWinnerWeighted(pokemon1, pokemon2);

        expect(result.winner).toBeDefined();
        expect(result.loser).toBeDefined();
    });

    it("should work with high level vs high level", () => {
        const pokemon1: PokemonModel = { ...pokemonA, nivel: 100 };
        const pokemon2: PokemonModel = { ...pokemonB, nivel: 100 };

        const result = pickWinnerWeighted(pokemon1, pokemon2);

        expect(result.winner).toBeDefined();
        expect(result.loser).toBeDefined();
    });
});

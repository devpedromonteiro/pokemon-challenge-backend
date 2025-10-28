import { type MockProxy, mock } from "jest-mock-extended";
import * as pickWinnerModule from "@/domain/battle/pick-winner-weighted";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";
import { setupBattlePokemon } from "@/domain/use-cases";

describe("BattlePokemon Use Case", () => {
    let pokemonRepository: MockProxy<PokemonRepository>;
    let sut: ReturnType<typeof setupBattlePokemon>;

    const pokemonA: PokemonModel = {
        id: 1,
        tipo: "pikachu",
        treinador: "Ash",
        nivel: 3,
    };

    const pokemonB: PokemonModel = {
        id: 2,
        tipo: "charizard",
        treinador: "Red",
        nivel: 5,
    };

    beforeAll(() => {
        pokemonRepository = mock<PokemonRepository>();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        pokemonRepository.loadById.mockImplementation(async (id) => {
            if (id === 1) return pokemonA;
            if (id === 2) return pokemonB;
            return null;
        });
        pokemonRepository.updateNivel.mockResolvedValue(undefined);
        pokemonRepository.deleteById.mockResolvedValue(undefined);
        sut = setupBattlePokemon(pokemonRepository);
    });

    it("should load both pokemons by id", async () => {
        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonA,
            loser: pokemonB,
        });

        await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(pokemonRepository.loadById).toHaveBeenCalledWith(1);
        expect(pokemonRepository.loadById).toHaveBeenCalledWith(2);
        expect(pokemonRepository.loadById).toHaveBeenCalledTimes(2);
    });

    it("should throw error if pokemonA does not exist", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce(null);

        const promise = sut({ pokemonAId: 999, pokemonBId: 2 });

        await expect(promise).rejects.toThrow("Pokemon not found");
    });

    it("should throw error if pokemonB does not exist", async () => {
        pokemonRepository.loadById.mockImplementation(async (id) => {
            if (id === 1) return pokemonA;
            return null;
        });

        const promise = sut({ pokemonAId: 1, pokemonBId: 999 });

        await expect(promise).rejects.toThrow("Pokemon not found");
    });

    it("should throw error if both pokemons do not exist", async () => {
        pokemonRepository.loadById.mockResolvedValue(null);

        const promise = sut({ pokemonAId: 999, pokemonBId: 998 });

        await expect(promise).rejects.toThrow("Pokemon not found");
    });

    it("should throw error if pokemonAId equals pokemonBId", async () => {
        const promise = sut({ pokemonAId: 1, pokemonBId: 1 });

        await expect(promise).rejects.toThrow("Cannot battle the same pokemon");
    });

    it("should increment winner level by 1", async () => {
        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonA,
            loser: pokemonB,
        });

        await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(pokemonRepository.updateNivel).toHaveBeenCalledWith(1, 4); // 3 + 1
    });

    it("should decrement loser level by 1", async () => {
        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonA,
            loser: pokemonB,
        });

        await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(pokemonRepository.updateNivel).toHaveBeenCalledWith(2, 4); // 5 - 1
    });

    it("should delete loser if level reaches 0", async () => {
        const pokemonWeakest: PokemonModel = { ...pokemonB, nivel: 1 };
        pokemonRepository.loadById.mockImplementation(async (id) => {
            if (id === 1) return pokemonA;
            if (id === 2) return pokemonWeakest;
            return null;
        });

        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonA,
            loser: pokemonWeakest,
        });

        await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(pokemonRepository.deleteById).toHaveBeenCalledWith(2);
        expect(pokemonRepository.updateNivel).not.toHaveBeenCalledWith(2, expect.anything());
    });

    it("should not delete loser if level does not reach 0", async () => {
        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonA,
            loser: pokemonB,
        });

        await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(pokemonRepository.deleteById).not.toHaveBeenCalled();
        expect(pokemonRepository.updateNivel).toHaveBeenCalledWith(2, 4);
    });

    it("should return vencedor with updated level", async () => {
        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonA,
            loser: pokemonB,
        });

        const result = await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(result.vencedor).toEqual({
            ...pokemonA,
            nivel: 4, // 3 + 1
        });
    });

    it("should return perdedor with updated level", async () => {
        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonA,
            loser: pokemonB,
        });

        const result = await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(result.perdedor).toEqual({
            ...pokemonB,
            nivel: 4, // 5 - 1
        });
    });

    it("should return perdedor with level 0 if deleted", async () => {
        const pokemonWeakest: PokemonModel = { ...pokemonB, nivel: 1 };
        pokemonRepository.loadById.mockImplementation(async (id) => {
            if (id === 1) return pokemonA;
            if (id === 2) return pokemonWeakest;
            return null;
        });

        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonA,
            loser: pokemonWeakest,
        });

        const result = await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(result.perdedor.nivel).toBe(0);
    });

    it("should work when pokemonB wins", async () => {
        jest.spyOn(pickWinnerModule, "pickWinnerWeighted").mockReturnValue({
            winner: pokemonB,
            loser: pokemonA,
        });

        const result = await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(result.vencedor.id).toBe(2);
        expect(result.vencedor.nivel).toBe(6); // 5 + 1
        expect(result.perdedor.id).toBe(1);
        expect(result.perdedor.nivel).toBe(2); // 3 - 1
    });

    it("should call pickWinnerWeighted with correct pokemons", async () => {
        const spy = jest.spyOn(pickWinnerModule, "pickWinnerWeighted");

        await sut({ pokemonAId: 1, pokemonBId: 2 });

        expect(spy).toHaveBeenCalledWith(pokemonA, pokemonB);
        expect(spy).toHaveBeenCalledTimes(1);
    });
});

import { type MockProxy, mock } from "jest-mock-extended";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";
import { setupLoadPokemonById } from "@/domain/use-cases";

describe("LoadPokemonById Use Case", () => {
    let pokemonRepository: MockProxy<PokemonRepository>;
    let sut: ReturnType<typeof setupLoadPokemonById>;

    const mockPokemon: PokemonModel = {
        id: 1,
        tipo: "pikachu",
        treinador: "Ash",
        nivel: 1,
    };

    beforeAll(() => {
        pokemonRepository = mock<PokemonRepository>();
        pokemonRepository.loadById.mockResolvedValue(mockPokemon);
    });

    beforeEach(() => {
        sut = setupLoadPokemonById(pokemonRepository);
    });

    it("should call pokemonRepository.loadById with correct id", async () => {
        await sut({ id: 1 });
        expect(pokemonRepository.loadById).toHaveBeenCalledWith(1);
        expect(pokemonRepository.loadById).toHaveBeenCalledTimes(1);
    });

    it("should return the pokemon when found", async () => {
        const result = await sut({ id: 1 });
        expect(result).toEqual(mockPokemon);
    });

    it("should return null when pokemon is not found", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce(null);
        const result = await sut({ id: 999 });
        expect(result).toBeNull();
    });

    it("should load pokemon with different ids", async () => {
        await sut({ id: 42 });
        expect(pokemonRepository.loadById).toHaveBeenCalledWith(42);
    });

    it("should load charizard pokemon", async () => {
        const charizard: PokemonModel = {
            id: 2,
            tipo: "charizard",
            treinador: "Red",
            nivel: 50,
        };
        pokemonRepository.loadById.mockResolvedValueOnce(charizard);
        const result = await sut({ id: 2 });
        expect(result).toEqual(charizard);
    });

    it("should load mewtwo pokemon", async () => {
        const mewtwo: PokemonModel = {
            id: 3,
            tipo: "mewtwo",
            treinador: "Giovanni",
            nivel: 70,
        };
        pokemonRepository.loadById.mockResolvedValueOnce(mewtwo);
        const result = await sut({ id: 3 });
        expect(result).toEqual(mewtwo);
    });

    it("should handle large id numbers", async () => {
        const largeId = 999999999;
        await sut({ id: largeId });
        expect(pokemonRepository.loadById).toHaveBeenCalledWith(largeId);
    });

    it("should rethrow errors from repository", async () => {
        const error = new Error("Database error");
        pokemonRepository.loadById.mockRejectedValueOnce(error);
        const promise = sut({ id: 1 });
        await expect(promise).rejects.toThrow(error);
    });

    it("should handle concurrent loads", async () => {
        const loadPromises = [sut({ id: 1 }), sut({ id: 2 }), sut({ id: 3 })];
        await Promise.allSettled(loadPromises);
        expect(pokemonRepository.loadById).toHaveBeenCalledTimes(3);
    });

    it("should return pokemon with correct properties", async () => {
        const result = await sut({ id: 1 });
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("tipo");
        expect(result).toHaveProperty("treinador");
        expect(result).toHaveProperty("nivel");
    });

    it("should handle zero as id", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce(null);
        const result = await sut({ id: 0 });
        expect(result).toBeNull();
    });

    it("should handle negative ids", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce(null);
        const result = await sut({ id: -1 });
        expect(result).toBeNull();
    });
});

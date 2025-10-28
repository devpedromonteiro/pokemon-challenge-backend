import { type MockProxy, mock } from "jest-mock-extended";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";
import { setupListPokemons } from "@/domain/use-cases";

describe("ListPokemons Use Case", () => {
    let pokemonRepository: MockProxy<PokemonRepository>;
    let sut: ReturnType<typeof setupListPokemons>;

    const mockPokemons: PokemonModel[] = [
        { id: 1, tipo: "pikachu", treinador: "Ash", nivel: 1 },
        { id: 2, tipo: "charizard", treinador: "Red", nivel: 50 },
        { id: 3, tipo: "mewtwo", treinador: "Giovanni", nivel: 70 },
    ];

    beforeAll(() => {
        pokemonRepository = mock<PokemonRepository>();
        pokemonRepository.listAll.mockResolvedValue(mockPokemons);
    });

    beforeEach(() => {
        sut = setupListPokemons(pokemonRepository);
    });

    it("should call pokemonRepository.listAll", async () => {
        await sut();
        expect(pokemonRepository.listAll).toHaveBeenCalledTimes(1);
    });

    it("should return array of pokemons", async () => {
        const result = await sut();
        expect(result).toEqual(mockPokemons);
    });

    it("should return empty array when no pokemons exist", async () => {
        pokemonRepository.listAll.mockResolvedValueOnce([]);
        const result = await sut();
        expect(result).toEqual([]);
    });

    it("should return array with single pokemon", async () => {
        const singlePokemon: PokemonModel[] = [
            { id: 1, tipo: "pikachu", treinador: "Ash", nivel: 1 },
        ];
        pokemonRepository.listAll.mockResolvedValueOnce(singlePokemon);
        const result = await sut();
        expect(result).toEqual(singlePokemon);
    });

    it("should return all pokemon types", async () => {
        const result = await sut();
        expect(result).toHaveLength(3);
        expect(result[0].tipo).toBe("pikachu");
        expect(result[1].tipo).toBe("charizard");
        expect(result[2].tipo).toBe("mewtwo");
    });

    it("should return pokemons with correct properties", async () => {
        const result = await sut();
        result.forEach((pokemon) => {
            expect(pokemon).toHaveProperty("id");
            expect(pokemon).toHaveProperty("tipo");
            expect(pokemon).toHaveProperty("treinador");
            expect(pokemon).toHaveProperty("nivel");
        });
    });

    it("should rethrow errors from repository", async () => {
        const error = new Error("Database error");
        pokemonRepository.listAll.mockRejectedValueOnce(error);
        const promise = sut();
        await expect(promise).rejects.toThrow(error);
    });

    it("should handle concurrent list requests", async () => {
        const listPromises = [sut(), sut(), sut()];
        await Promise.allSettled(listPromises);
        expect(pokemonRepository.listAll).toHaveBeenCalledTimes(3);
    });

    it("should return large lists efficiently", async () => {
        const largeList: PokemonModel[] = Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            tipo: "pikachu" as const,
            treinador: `Trainer ${i}`,
            nivel: 1,
        }));
        pokemonRepository.listAll.mockResolvedValueOnce(largeList);
        const result = await sut();
        expect(result).toHaveLength(100);
    });

    it("should return pokemons with different nivels", async () => {
        const result = await sut();
        expect(result[0].nivel).toBe(1);
        expect(result[1].nivel).toBe(50);
        expect(result[2].nivel).toBe(70);
    });

    it("should maintain pokemon order from repository", async () => {
        const result = await sut();
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(2);
        expect(result[2].id).toBe(3);
    });
});

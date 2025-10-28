import { type MockProxy, mock } from "jest-mock-extended";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";
import { type CreatePokemon, setupCreatePokemon } from "@/domain/use-cases";

describe("CreatePokemon Use Case", () => {
    let sut: CreatePokemon;
    let pokemonRepository: MockProxy<PokemonRepository>;
    let fakePokemon: PokemonModel;

    beforeAll(() => {
        fakePokemon = {
            id: 1,
            tipo: "pikachu",
            treinador: "Ash",
            nivel: 1,
        };
        pokemonRepository = mock();
        pokemonRepository.create.mockResolvedValue(fakePokemon);
    });

    beforeEach(() => {
        sut = setupCreatePokemon(pokemonRepository);
    });

    it("should call repository create with correct params", async () => {
        await sut({ tipo: "pikachu", treinador: "Ash" });

        expect(pokemonRepository.create).toHaveBeenCalledWith({
            tipo: "pikachu",
            treinador: "Ash",
        });
        expect(pokemonRepository.create).toHaveBeenCalledTimes(1);
    });

    it("should return created Pokemon", async () => {
        const result = await sut({ tipo: "pikachu", treinador: "Ash" });

        expect(result).toEqual(fakePokemon);
    });

    it("should create Pokemon with tipo pikachu", async () => {
        const result = await sut({ tipo: "pikachu", treinador: "Ash" });

        expect(result.tipo).toBe("pikachu");
        expect(result.nivel).toBe(1);
    });

    it("should create Pokemon with tipo charizard", async () => {
        pokemonRepository.create.mockResolvedValueOnce({
            id: 2,
            tipo: "charizard",
            treinador: "Red",
            nivel: 1,
        });

        const result = await sut({ tipo: "charizard", treinador: "Red" });

        expect(result.tipo).toBe("charizard");
        expect(pokemonRepository.create).toHaveBeenCalledWith({
            tipo: "charizard",
            treinador: "Red",
        });
    });

    it("should create Pokemon with tipo mewtwo", async () => {
        pokemonRepository.create.mockResolvedValueOnce({
            id: 3,
            tipo: "mewtwo",
            treinador: "Giovanni",
            nivel: 1,
        });

        const result = await sut({ tipo: "mewtwo", treinador: "Giovanni" });

        expect(result.tipo).toBe("mewtwo");
    });

    it("should create Pokemon with special characters in treinador", async () => {
        await sut({ tipo: "pikachu", treinador: "José María" });

        expect(pokemonRepository.create).toHaveBeenCalledWith({
            tipo: "pikachu",
            treinador: "José María",
        });
    });

    it("should return Pokemon with nivel 1 by default", async () => {
        const result = await sut({ tipo: "pikachu", treinador: "Trainer" });

        expect(result.nivel).toBe(1);
    });

    it("should rethrow errors from repository", async () => {
        pokemonRepository.create.mockRejectedValueOnce(new Error("Database error"));

        const promise = sut({ tipo: "pikachu", treinador: "Ash" });

        await expect(promise).rejects.toThrow("Database error");
    });

    it("should handle concurrent creations", async () => {
        pokemonRepository.create.mockResolvedValue(fakePokemon);

        const promises = [
            sut({ tipo: "pikachu", treinador: "Trainer 1" }),
            sut({ tipo: "charizard", treinador: "Trainer 2" }),
            sut({ tipo: "mewtwo", treinador: "Trainer 3" }),
        ];

        const results = await Promise.all(promises);

        expect(results).toHaveLength(3);
        expect(pokemonRepository.create).toHaveBeenCalledTimes(3);
    });
});

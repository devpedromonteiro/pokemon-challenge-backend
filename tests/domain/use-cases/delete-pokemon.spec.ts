import { type MockProxy, mock } from "jest-mock-extended";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";
import { type DeletePokemon, setupDeletePokemon } from "@/domain/use-cases";

describe("DeletePokemon Use Case", () => {
    let sut: DeletePokemon;
    let pokemonRepository: MockProxy<PokemonRepository>;
    let fakePokemon: PokemonModel;

    beforeAll(() => {
        fakePokemon = {
            id: 1,
            tipo: "pikachu",
            treinador: "Ash",
            nivel: 5,
        };
        pokemonRepository = mock();
        pokemonRepository.loadById.mockResolvedValue(fakePokemon);
        pokemonRepository.deleteById.mockResolvedValue(undefined);
    });

    beforeEach(() => {
        sut = setupDeletePokemon(pokemonRepository);
    });

    it("should call loadById with correct id", async () => {
        await sut({ id: 1 });

        expect(pokemonRepository.loadById).toHaveBeenCalledWith(1);
        expect(pokemonRepository.loadById).toHaveBeenCalledTimes(1);
    });

    it("should throw error if Pokemon does not exist", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce(null);

        const promise = sut({ id: 999 });

        await expect(promise).rejects.toThrow("Pokemon not found");
    });

    it("should not call deleteById if Pokemon does not exist", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce(null);

        await sut({ id: 999 }).catch(() => {
            /* empty function for testing */
        });

        expect(pokemonRepository.deleteById).not.toHaveBeenCalled();
    });

    it("should call deleteById with correct id when Pokemon exists", async () => {
        await sut({ id: 1 });

        expect(pokemonRepository.deleteById).toHaveBeenCalledWith(1);
        expect(pokemonRepository.deleteById).toHaveBeenCalledTimes(1);
    });

    it("should call deleteById after loadById", async () => {
        const callOrder: string[] = [];

        pokemonRepository.loadById.mockImplementation(async () => {
            callOrder.push("loadById");
            return fakePokemon;
        });

        pokemonRepository.deleteById.mockImplementation(async () => {
            callOrder.push("deleteById");
        });

        await sut({ id: 1 });

        expect(callOrder).toEqual(["loadById", "deleteById"]);
    });

    it("should delete Pokemon with different ids", async () => {
        await sut({ id: 42 });

        expect(pokemonRepository.loadById).toHaveBeenCalledWith(42);
        expect(pokemonRepository.deleteById).toHaveBeenCalledWith(42);
    });

    it("should complete successfully when Pokemon exists", async () => {
        const promise = sut({ id: 1 });

        await expect(promise).resolves.toBeUndefined();
    });

    it("should rethrow errors from repository", async () => {
        pokemonRepository.deleteById.mockRejectedValueOnce(new Error("Database error"));

        const promise = sut({ id: 1 });

        await expect(promise).rejects.toThrow("Database error");
    });

    it("should handle concurrent deletions", async () => {
        const promises = [sut({ id: 1 }), sut({ id: 2 }), sut({ id: 3 })];

        await expect(Promise.all(promises)).resolves.toBeDefined();
    });
});

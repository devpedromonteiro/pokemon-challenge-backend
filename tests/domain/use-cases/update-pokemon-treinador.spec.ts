import { type MockProxy, mock } from "jest-mock-extended";
import type { PokemonRepository } from "@/domain/contracts/repos";
import { setupUpdatePokemonTreinador } from "@/domain/use-cases";

describe("UpdatePokemonTreinador Use Case", () => {
    let pokemonRepository: MockProxy<PokemonRepository>;
    let sut: ReturnType<typeof setupUpdatePokemonTreinador>;

    beforeAll(() => {
        pokemonRepository = mock<PokemonRepository>();
        pokemonRepository.loadById.mockResolvedValue({
            id: 1,
            tipo: "pikachu",
            treinador: "Ash",
            nivel: 1,
        });
        pokemonRepository.updateTreinador.mockResolvedValue(undefined);
    });

    beforeEach(() => {
        sut = setupUpdatePokemonTreinador(pokemonRepository);
    });

    it("should call loadById with correct id", async () => {
        await sut({ id: 1, treinador: "New Trainer" });
        expect(pokemonRepository.loadById).toHaveBeenCalledWith(1);
        expect(pokemonRepository.loadById).toHaveBeenCalledTimes(1);
    });

    it("should throw error if Pokemon does not exist", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce(null);
        const promise = sut({ id: 999, treinador: "New Trainer" });
        await expect(promise).rejects.toThrow(new Error("Pokemon not found"));
    });

    it("should not call updateTreinador if Pokemon does not exist", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce(null);
        await expect(sut({ id: 999, treinador: "New Trainer" })).rejects.toThrow();
        expect(pokemonRepository.updateTreinador).not.toHaveBeenCalled();
    });

    it("should call updateTreinador with correct params when Pokemon exists", async () => {
        await sut({ id: 1, treinador: "New Trainer" });
        expect(pokemonRepository.updateTreinador).toHaveBeenCalledWith(1, "New Trainer");
        expect(pokemonRepository.updateTreinador).toHaveBeenCalledTimes(1);
    });

    it("should verify Pokemon existence before updating", async () => {
        await sut({ id: 1, treinador: "New Trainer" });
        expect(pokemonRepository.loadById).toHaveBeenCalled();
        expect(pokemonRepository.updateTreinador).toHaveBeenCalled();
    });

    it("should update Pokemon with different ids", async () => {
        pokemonRepository.loadById.mockResolvedValueOnce({
            id: 2,
            tipo: "charizard",
            treinador: "Red",
            nivel: 5,
        });
        await sut({ id: 2, treinador: "Blue" });
        expect(pokemonRepository.updateTreinador).toHaveBeenCalledWith(2, "Blue");
    });

    it("should complete successfully when Pokemon exists", async () => {
        const promise = sut({ id: 1, treinador: "New Trainer" });
        await expect(promise).resolves.toBeUndefined();
    });

    it("should rethrow errors from repository.loadById", async () => {
        const error = new Error("Repository error");
        pokemonRepository.loadById.mockRejectedValueOnce(error);
        const promise = sut({ id: 1, treinador: "New Trainer" });
        await expect(promise).rejects.toThrow(error);
    });

    it("should rethrow errors from repository.updateTreinador", async () => {
        const error = new Error("Update failed");
        pokemonRepository.updateTreinador.mockRejectedValueOnce(error);
        const promise = sut({ id: 1, treinador: "New Trainer" });
        await expect(promise).rejects.toThrow(error);
    });

    it("should handle concurrent updates", async () => {
        const updatePromises = [
            sut({ id: 1, treinador: "Trainer 1" }),
            sut({ id: 1, treinador: "Trainer 2" }),
            sut({ id: 1, treinador: "Trainer 3" }),
        ];
        await Promise.allSettled(updatePromises);
        expect(pokemonRepository.loadById).toHaveBeenCalledTimes(3);
        expect(pokemonRepository.updateTreinador).toHaveBeenCalledTimes(3);
    });

    it("should handle empty string treinador", async () => {
        await sut({ id: 1, treinador: "" });
        expect(pokemonRepository.updateTreinador).toHaveBeenCalledWith(1, "");
    });

    it("should handle very long treinador names", async () => {
        const longName = "A".repeat(255);
        await sut({ id: 1, treinador: longName });
        expect(pokemonRepository.updateTreinador).toHaveBeenCalledWith(1, longName);
    });
});

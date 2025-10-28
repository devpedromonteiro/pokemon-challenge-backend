import { type MockProxy, mock } from "jest-mock-extended";
import { UpdatePokemonTreinadorController } from "@/application/controllers/pokemon";
import type { PokemonRepository } from "@/domain/contracts/repos";

describe("UpdatePokemonTreinadorController", () => {
    let sut: UpdatePokemonTreinadorController;
    let pokemonRepository: MockProxy<PokemonRepository>;

    beforeAll(() => {
        pokemonRepository = mock();
        pokemonRepository.updateTreinador.mockResolvedValue(undefined);
    });

    beforeEach(() => {
        sut = new UpdatePokemonTreinadorController(pokemonRepository);
    });

    describe("buildValidators", () => {
        it("should return error if id is missing", async () => {
            const httpRequest = { treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if id is empty string", async () => {
            const httpRequest = { id: "", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if treinador is missing", async () => {
            const httpRequest = { id: "1" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if treinador is empty string", async () => {
            const httpRequest = { id: "1", treinador: "" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });
    });

    describe("perform", () => {
        it("should call repository with correct params", async () => {
            const httpRequest = { id: "1", treinador: "Gary" };

            await sut.handle(httpRequest);

            expect(pokemonRepository.updateTreinador).toHaveBeenCalledWith(1, "Gary");
            expect(pokemonRepository.updateTreinador).toHaveBeenCalledTimes(1);
        });

        it("should return 204 No Content on success", async () => {
            const httpRequest = { id: "1", treinador: "Gary" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(204);
            expect(httpResponse.data).toBeNull();
        });

        it("should update treinador with numeric string id", async () => {
            const httpRequest = { id: "42", treinador: "Misty" };

            await sut.handle(httpRequest);

            expect(pokemonRepository.updateTreinador).toHaveBeenCalledWith(42, "Misty");
        });

        it("should return 500 if repository throws", async () => {
            pokemonRepository.updateTreinador.mockRejectedValueOnce(new Error("Database error"));

            const httpRequest = { id: "1", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });
    });
});

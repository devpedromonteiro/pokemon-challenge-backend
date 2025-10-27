import { type MockProxy, mock } from "jest-mock-extended";
import { CreatePokemonController } from "@/application/controllers/pokemon";
import { ValidationError } from "@/application/errors";
import type { PokemonRepository } from "@/domain/contracts/repos";

describe("CreatePokemonController", () => {
    let sut: CreatePokemonController;
    let pokemonRepository: MockProxy<PokemonRepository>;

    beforeAll(() => {
        pokemonRepository = mock();
        pokemonRepository.create.mockResolvedValue({
            id: 1,
            tipo: "pikachu",
            treinador: "Ash",
            nivel: 1,
        });
    });

    beforeEach(() => {
        sut = new CreatePokemonController(pokemonRepository);
    });

    describe("buildValidators", () => {
        it("should return error if tipo is missing", async () => {
            const httpRequest = { treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if tipo is invalid", async () => {
            const httpRequest = { tipo: "bulbasaur", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(ValidationError);
            expect(httpResponse.data.message).toContain("tipo must be one of");
        });

        it("should return error if treinador is missing", async () => {
            const httpRequest = { tipo: "pikachu" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if treinador is empty string", async () => {
            const httpRequest = { tipo: "pikachu", treinador: "" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if nivel is provided", async () => {
            const httpRequest = { tipo: "pikachu", treinador: "Ash", nivel: 999 };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(ValidationError);
            expect(httpResponse.data.message).toContain("nivel should not be provided");
        });
    });

    describe("perform", () => {
        it("should call repository with correct params", async () => {
            const httpRequest = { tipo: "pikachu", treinador: "Ash" };

            await sut.handle(httpRequest);

            expect(pokemonRepository.create).toHaveBeenCalledWith({
                tipo: "pikachu",
                treinador: "Ash",
            });
            expect(pokemonRepository.create).toHaveBeenCalledTimes(1);
        });

        it("should return 201 with created Pokemon", async () => {
            const httpRequest = { tipo: "pikachu", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(201);
            expect(httpResponse.data).toEqual({
                id: 1,
                tipo: "pikachu",
                treinador: "Ash",
                nivel: 1,
            });
        });

        it("should work with tipo charizard", async () => {
            pokemonRepository.create.mockResolvedValueOnce({
                id: 2,
                tipo: "charizard",
                treinador: "Red",
                nivel: 1,
            });

            const httpRequest = { tipo: "charizard", treinador: "Red" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(201);
            expect(httpResponse.data).toEqual({
                id: 2,
                tipo: "charizard",
                treinador: "Red",
                nivel: 1,
            });
        });

        it("should work with tipo mewtwo", async () => {
            pokemonRepository.create.mockResolvedValueOnce({
                id: 3,
                tipo: "mewtwo",
                treinador: "Giovanni",
                nivel: 1,
            });

            const httpRequest = { tipo: "mewtwo", treinador: "Giovanni" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(201);
            expect(httpResponse.data).toEqual({
                id: 3,
                tipo: "mewtwo",
                treinador: "Giovanni",
                nivel: 1,
            });
        });

        it("should return 500 if repository throws", async () => {
            pokemonRepository.create.mockRejectedValueOnce(new Error("Database error"));

            const httpRequest = { tipo: "pikachu", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });
    });
});

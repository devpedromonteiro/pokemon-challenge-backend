import { Controller } from "@/application/controllers";
import { CreatePokemonController } from "@/application/controllers/pokemon";
import { ValidationError } from "@/application/errors";

describe("CreatePokemonController", () => {
    let sut: CreatePokemonController;
    let createPokemon: jest.Mock;

    beforeAll(() => {
        createPokemon = jest.fn();
        createPokemon.mockResolvedValue({
            id: 1,
            tipo: "pikachu",
            treinador: "Ash",
            nivel: 1,
        });
    });

    beforeEach(() => {
        sut = new CreatePokemonController(createPokemon);
    });

    it("should extend Controller", () => {
        expect(sut).toBeInstanceOf(Controller);
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
        it("should call CreatePokemon use case with correct params", async () => {
            const httpRequest = { tipo: "pikachu", treinador: "Ash" };

            await sut.handle(httpRequest);

            expect(createPokemon).toHaveBeenCalledWith({
                tipo: "pikachu",
                treinador: "Ash",
            });
            expect(createPokemon).toHaveBeenCalledTimes(1);
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
            createPokemon.mockResolvedValueOnce({
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
            createPokemon.mockResolvedValueOnce({
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

        it("should return 500 if use case throws", async () => {
            createPokemon.mockRejectedValueOnce(new Error("Database error"));

            const httpRequest = { tipo: "pikachu", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });
    });
});

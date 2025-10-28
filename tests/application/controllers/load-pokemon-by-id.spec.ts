import { Controller } from "@/application/controllers";
import { LoadPokemonByIdController } from "@/application/controllers/pokemon";
import { notFound, ok } from "@/application/helpers";
import type { PokemonModel } from "@/domain/contracts/repos";

describe("LoadPokemonByIdController", () => {
    let sut: LoadPokemonByIdController;
    let loadPokemonById: jest.Mock;
    let fakePokemon: PokemonModel;

    beforeAll(() => {
        fakePokemon = {
            id: 1,
            tipo: "pikachu",
            treinador: "Ash",
            nivel: 5,
        };
        loadPokemonById = jest.fn();
        loadPokemonById.mockResolvedValue(fakePokemon);
    });

    beforeEach(() => {
        sut = new LoadPokemonByIdController(loadPokemonById);
    });

    it("should extend Controller", () => {
        expect(sut).toBeInstanceOf(Controller);
    });

    describe("buildValidators", () => {
        it("should return error if id is missing", async () => {
            const httpResponse = await sut.handle({});

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if id is empty string", async () => {
            const httpResponse = await sut.handle({ id: "" });

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if id is not a valid number", async () => {
            const httpResponse = await sut.handle({ id: "abc" });

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
            expect((httpResponse.data as Error).message).toContain("valid number");
        });

        it("should return error if id contains special characters", async () => {
            const httpResponse = await sut.handle({ id: "1@#$" });

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });
    });

    describe("perform", () => {
        it("should call LoadPokemonById use case with correct id", async () => {
            await sut.handle({ id: "1" });

            expect(loadPokemonById).toHaveBeenCalledWith({ id: 1 });
            expect(loadPokemonById).toHaveBeenCalledTimes(1);
        });

        it("should return 200 with Pokemon data when found", async () => {
            const httpResponse = await sut.handle({ id: "1" });

            expect(httpResponse).toEqual(ok(fakePokemon));
            expect(httpResponse.statusCode).toBe(200);
        });

        it("should return Pokemon with correct properties", async () => {
            const httpResponse = await sut.handle({ id: "1" });

            expect(httpResponse.data).toHaveProperty("id", 1);
            expect(httpResponse.data).toHaveProperty("tipo", "pikachu");
            expect(httpResponse.data).toHaveProperty("treinador", "Ash");
            expect(httpResponse.data).toHaveProperty("nivel", 5);
        });

        it("should return 404 when Pokemon is not found", async () => {
            loadPokemonById.mockResolvedValueOnce(null);

            const httpResponse = await sut.handle({ id: "999" });

            expect(httpResponse).toEqual(notFound(new Error("Pokemon not found")));
        });

        it("should call use case with large id numbers", async () => {
            await sut.handle({ id: "999999" });

            expect(loadPokemonById).toHaveBeenCalledWith({ id: 999999 });
        });

        it("should return 500 if use case throws", async () => {
            loadPokemonById.mockRejectedValueOnce(new Error("Database error"));

            const httpResponse = await sut.handle({ id: "1" });

            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should load different Pokemon types correctly", async () => {
            const charizardPokemon: PokemonModel = {
                id: 2,
                tipo: "charizard",
                treinador: "Red",
                nivel: 10,
            };
            loadPokemonById.mockResolvedValueOnce(charizardPokemon);

            const httpResponse = await sut.handle({ id: "2" });

            expect(httpResponse.data).toEqual(charizardPokemon);
        });
    });
});

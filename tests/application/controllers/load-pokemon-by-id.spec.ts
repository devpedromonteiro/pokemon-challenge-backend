import { type MockProxy, mock } from "jest-mock-extended";
import { LoadPokemonByIdController } from "@/application/controllers/pokemon";
import { ok } from "@/application/helpers";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";

describe("LoadPokemonByIdController", () => {
    let sut: LoadPokemonByIdController;
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
    });

    beforeEach(() => {
        sut = new LoadPokemonByIdController(pokemonRepository);
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
        it("should call repository with correct id", async () => {
            await sut.handle({ id: "1" });

            expect(pokemonRepository.loadById).toHaveBeenCalledWith(1);
            expect(pokemonRepository.loadById).toHaveBeenCalledTimes(1);
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
            pokemonRepository.loadById.mockResolvedValueOnce(null);

            const httpResponse = await sut.handle({ id: "999" });

            expect(httpResponse.statusCode).toBe(404);
            expect(httpResponse.data).toBeInstanceOf(Error);
            expect((httpResponse.data as Error).message).toBe("Pokemon not found");
        });

        it("should work with large id numbers", async () => {
            await sut.handle({ id: "999999" });

            expect(pokemonRepository.loadById).toHaveBeenCalledWith(999999);
        });

        it("should return 500 if repository throws", async () => {
            pokemonRepository.loadById.mockRejectedValueOnce(new Error("Database error"));

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
            pokemonRepository.loadById.mockResolvedValueOnce(charizardPokemon);

            const httpResponse = await sut.handle({ id: "2" });

            expect(httpResponse.data).toEqual(charizardPokemon);
        });
    });
});

import { Controller } from "@/application/controllers";
import { BattlePokemonController } from "@/application/controllers/battle";
import { badRequest, notFound, ok } from "@/application/helpers";
import type { PokemonModel } from "@/domain/contracts/repos";

describe("BattlePokemonController", () => {
    let sut: BattlePokemonController;
    let battlePokemon: jest.Mock;

    const vencedor: PokemonModel = {
        id: 1,
        tipo: "pikachu",
        treinador: "Ash",
        nivel: 4,
    };

    const perdedor: PokemonModel = {
        id: 2,
        tipo: "charizard",
        treinador: "Red",
        nivel: 4,
    };

    beforeAll(() => {
        battlePokemon = jest.fn();
        battlePokemon.mockResolvedValue({ vencedor, perdedor });
    });

    beforeEach(() => {
        sut = new BattlePokemonController(battlePokemon);
    });

    it("should extend Controller", () => {
        expect(sut).toBeInstanceOf(Controller);
    });

    describe("buildValidators", () => {
        it("should return error if pokemonAId is missing", async () => {
            const httpRequest = { pokemonBId: "2" };
            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if pokemonBId is missing", async () => {
            const httpRequest = { pokemonAId: "1" };
            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if pokemonAId is not a valid number", async () => {
            const httpRequest = { pokemonAId: "abc", pokemonBId: "2" };
            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
            expect((httpResponse.data as Error).message).toContain("valid number");
        });

        it("should return error if pokemonBId is not a valid number", async () => {
            const httpRequest = { pokemonAId: "1", pokemonBId: "xyz" };
            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
            expect((httpResponse.data as Error).message).toContain("valid number");
        });

        it("should return error if pokemonAId equals pokemonBId", async () => {
            const httpRequest = { pokemonAId: "1", pokemonBId: "1" };
            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
            expect((httpResponse.data as Error).message).toBe("Cannot battle the same pokemon");
        });
    });

    describe("perform", () => {
        it("should call BattlePokemon use case with correct params", async () => {
            const httpRequest = { pokemonAId: "1", pokemonBId: "2" };

            await sut.handle(httpRequest);

            expect(battlePokemon).toHaveBeenCalledWith({ pokemonAId: 1, pokemonBId: 2 });
            expect(battlePokemon).toHaveBeenCalledTimes(1);
        });

        it("should return 200 with battle result on success", async () => {
            const httpRequest = { pokemonAId: "1", pokemonBId: "2" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse).toEqual(ok({ vencedor, perdedor }));
        });

        it("should return vencedor and perdedor in response", async () => {
            const httpRequest = { pokemonAId: "1", pokemonBId: "2" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.data).toHaveProperty("vencedor");
            expect(httpResponse.data).toHaveProperty("perdedor");
        });

        it("should return 404 if Pokemon not found", async () => {
            battlePokemon.mockRejectedValueOnce(new Error("Pokemon not found"));

            const httpRequest = { pokemonAId: "999", pokemonBId: "2" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse).toEqual(notFound(new Error("Pokemon not found")));
        });

        it("should return 400 if trying to battle same pokemon", async () => {
            battlePokemon.mockRejectedValueOnce(new Error("Cannot battle the same pokemon"));

            const httpRequest = { pokemonAId: "1", pokemonBId: "1" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse).toEqual(badRequest(new Error("Cannot battle the same pokemon")));
        });

        it("should work with large id numbers", async () => {
            const httpRequest = { pokemonAId: "999999", pokemonBId: "888888" };

            await sut.handle(httpRequest);

            expect(battlePokemon).toHaveBeenCalledWith({
                pokemonAId: 999999,
                pokemonBId: 888888,
            });
        });

        it("should return perdedor with nivel 0 if deleted", async () => {
            const perdedorDeleted = { ...perdedor, nivel: 0 };
            battlePokemon.mockResolvedValueOnce({
                vencedor,
                perdedor: perdedorDeleted,
            });

            const httpRequest = { pokemonAId: "1", pokemonBId: "2" };

            const httpResponse = await sut.handle(httpRequest);

            expect((httpResponse.data as any).perdedor.nivel).toBe(0);
        });
    });
});

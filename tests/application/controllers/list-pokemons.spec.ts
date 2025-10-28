import { type MockProxy, mock } from "jest-mock-extended";
import { ListPokemonsController } from "@/application/controllers/pokemon";
import { ok } from "@/application/helpers";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";

describe("ListPokemonsController", () => {
    let sut: ListPokemonsController;
    let pokemonRepository: MockProxy<PokemonRepository>;
    let fakePokemons: PokemonModel[];

    beforeAll(() => {
        fakePokemons = [
            {
                id: 1,
                tipo: "pikachu",
                treinador: "Ash",
                nivel: 5,
            },
            {
                id: 2,
                tipo: "charizard",
                treinador: "Red",
                nivel: 10,
            },
            {
                id: 3,
                tipo: "mewtwo",
                treinador: "Giovanni",
                nivel: 50,
            },
        ];
        pokemonRepository = mock();
        pokemonRepository.listAll.mockResolvedValue(fakePokemons);
    });

    beforeEach(() => {
        sut = new ListPokemonsController(pokemonRepository);
    });

    describe("buildValidators", () => {
        it("should return empty array (no validation needed)", () => {
            const validators = sut.buildValidators({});

            expect(validators).toEqual([]);
            expect(validators).toHaveLength(0);
        });
    });

    describe("perform", () => {
        it("should call repository listAll", async () => {
            await sut.handle({});

            expect(pokemonRepository.listAll).toHaveBeenCalledWith();
            expect(pokemonRepository.listAll).toHaveBeenCalledTimes(1);
        });

        it("should return 200 with array of Pokemons", async () => {
            const httpResponse = await sut.handle({});

            expect(httpResponse).toEqual(ok(fakePokemons));
            expect(httpResponse.statusCode).toBe(200);
        });

        it("should return all Pokemons in the list", async () => {
            const httpResponse = await sut.handle({});

            expect(httpResponse.data).toEqual(fakePokemons);
            expect(httpResponse.data).toHaveLength(3);
        });

        it("should return Pokemons with correct properties", async () => {
            const httpResponse = await sut.handle({});
            const pokemons = httpResponse.data as PokemonModel[];

            expect(pokemons[0]).toHaveProperty("id", 1);
            expect(pokemons[0]).toHaveProperty("tipo", "pikachu");
            expect(pokemons[0]).toHaveProperty("treinador", "Ash");
            expect(pokemons[0]).toHaveProperty("nivel", 5);

            expect(pokemons[1]).toHaveProperty("id", 2);
            expect(pokemons[1]).toHaveProperty("tipo", "charizard");

            expect(pokemons[2]).toHaveProperty("id", 3);
            expect(pokemons[2]).toHaveProperty("tipo", "mewtwo");
        });

        it("should return empty array when no Pokemons exist", async () => {
            pokemonRepository.listAll.mockResolvedValueOnce([]);

            const httpResponse = await sut.handle({});

            expect(httpResponse.statusCode).toBe(200);
            expect(httpResponse.data).toEqual([]);
            expect(httpResponse.data).toHaveLength(0);
        });

        it("should return array with single Pokemon", async () => {
            const singlePokemon = [fakePokemons[0]];
            pokemonRepository.listAll.mockResolvedValueOnce(singlePokemon);

            const httpResponse = await sut.handle({});

            expect(httpResponse.data).toHaveLength(1);
            expect(httpResponse.data).toEqual(singlePokemon);
        });

        it("should return 500 if repository throws", async () => {
            pokemonRepository.listAll.mockRejectedValueOnce(new Error("Database error"));

            const httpResponse = await sut.handle({});

            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return Pokemons sorted by database order", async () => {
            const httpResponse = await sut.handle({});
            const pokemons = httpResponse.data as PokemonModel[];

            expect(pokemons[0].id).toBe(1);
            expect(pokemons[1].id).toBe(2);
            expect(pokemons[2].id).toBe(3);
        });

        it("should handle large lists of Pokemons", async () => {
            const largeList = Array.from({ length: 100 }, (_, i) => ({
                id: i + 1,
                tipo: "pikachu" as const,
                treinador: `Trainer ${i + 1}`,
                nivel: i + 1,
            }));
            pokemonRepository.listAll.mockResolvedValueOnce(largeList);

            const httpResponse = await sut.handle({});

            expect(httpResponse.data).toHaveLength(100);
            expect(httpResponse.statusCode).toBe(200);
        });
    });
});

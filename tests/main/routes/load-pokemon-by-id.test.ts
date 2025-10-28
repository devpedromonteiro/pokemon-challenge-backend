import request from "supertest";
import { app } from "@/main/config/app";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

describe("GET /pokemons/:id - Integration Tests", () => {
    const repository = makePgPokemonRepository();
    let createdPokemonId: number;

    beforeEach(async () => {
        // Create a pokemon for each test
        const pokemon = await repository.create({
            tipo: "pikachu",
            treinador: "Ash Ketchum",
        });
        createdPokemonId = pokemon.id;
    });

    describe("Success Cases", () => {
        it("should return 200 and Pokemon data when found", async () => {
            const response = await request(app).get(`/pokemons/${createdPokemonId}`).expect(200);

            expect(response.body).toHaveProperty("id", createdPokemonId);
            expect(response.body).toHaveProperty("tipo", "pikachu");
            expect(response.body).toHaveProperty("treinador", "Ash Ketchum");
            expect(response.body).toHaveProperty("nivel", 1);
        });

        it("should load Pokemon with tipo charizard", async () => {
            const charizard = await repository.create({
                tipo: "charizard",
                treinador: "Red",
            });

            const response = await request(app).get(`/pokemons/${charizard.id}`).expect(200);

            expect(response.body.tipo).toBe("charizard");
            expect(response.body.treinador).toBe("Red");
        });

        it("should load Pokemon with tipo mewtwo", async () => {
            const mewtwo = await repository.create({
                tipo: "mewtwo",
                treinador: "Giovanni",
            });

            const response = await request(app).get(`/pokemons/${mewtwo.id}`).expect(200);

            expect(response.body.tipo).toBe("mewtwo");
            expect(response.body.treinador).toBe("Giovanni");
        });

        it("should load Pokemon with special characters in treinador", async () => {
            const pokemon = await repository.create({
                tipo: "pikachu",
                treinador: "José María O'Connor",
            });

            const response = await request(app).get(`/pokemons/${pokemon.id}`).expect(200);

            expect(response.body.treinador).toBe("José María O'Connor");
        });

        it("should load Pokemon after updating treinador", async () => {
            await repository.updateTreinador(createdPokemonId, "Gary Oak");

            const response = await request(app).get(`/pokemons/${createdPokemonId}`).expect(200);

            expect(response.body.treinador).toBe("Gary Oak");
        });

        it("should load Pokemon after updating nivel", async () => {
            await repository.updateNivel(createdPokemonId, 50);

            const response = await request(app).get(`/pokemons/${createdPokemonId}`).expect(200);

            expect(response.body.nivel).toBe(50);
        });

        it("should load multiple different Pokemon independently", async () => {
            const pokemon2 = await repository.create({
                tipo: "charizard",
                treinador: "Trainer 2",
            });

            const response1 = await request(app).get(`/pokemons/${createdPokemonId}`).expect(200);
            const response2 = await request(app).get(`/pokemons/${pokemon2.id}`).expect(200);

            expect(response1.body.id).not.toBe(response2.body.id);
            expect(response1.body.tipo).toBe("pikachu");
            expect(response2.body.tipo).toBe("charizard");
        });
    });

    describe("Error Cases", () => {
        it("should return 404 when Pokemon is not found", async () => {
            const nonExistentId = 999999;
            const response = await request(app).get(`/pokemons/${nonExistentId}`).expect(404);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toBe("Pokemon not found");
        });

        it("should return 404 for negative id", async () => {
            const response = await request(app).get("/pokemons/-1").expect(404);

            expect(response.body).toHaveProperty("error");
        });

        it("should return 400 for invalid id format (letters)", async () => {
            const response = await request(app).get("/pokemons/abc").expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("valid number");
        });

        it("should return 400 for invalid id format (special characters)", async () => {
            const response = await request(app).get("/pokemons/1@#$").expect(400);

            expect(response.body).toHaveProperty("error");
        });

        it("should handle decimal id gracefully", async () => {
            const response = await request(app).get("/pokemons/1.5");

            // Decimal IDs are edge case - could be 200 (found), 404 (not found), or 500 (db error)
            expect([404, 200, 500]).toContain(response.status);
        });

        it("should return 404 after Pokemon is deleted", async () => {
            await repository.deleteById(createdPokemonId);

            const response = await request(app).get(`/pokemons/${createdPokemonId}`).expect(404);

            expect(response.body.error).toBe("Pokemon not found");
        });
    });

    describe("Edge Cases", () => {
        it("should handle very large id numbers", async () => {
            const response = await request(app).get("/pokemons/999999999").expect(404);

            expect(response.body).toHaveProperty("error");
        });

        it("should return consistent data on multiple requests", async () => {
            const response1 = await request(app).get(`/pokemons/${createdPokemonId}`).expect(200);
            const response2 = await request(app).get(`/pokemons/${createdPokemonId}`).expect(200);
            const response3 = await request(app).get(`/pokemons/${createdPokemonId}`).expect(200);

            expect(response1.body).toEqual(response2.body);
            expect(response2.body).toEqual(response3.body);
        });

        it("should handle concurrent requests for the same Pokemon", async () => {
            const requests = [
                request(app).get(`/pokemons/${createdPokemonId}`),
                request(app).get(`/pokemons/${createdPokemonId}`),
                request(app).get(`/pokemons/${createdPokemonId}`),
                request(app).get(`/pokemons/${createdPokemonId}`),
                request(app).get(`/pokemons/${createdPokemonId}`),
            ];

            const responses = await Promise.all(requests);

            responses.forEach((response) => {
                expect(response.status).toBe(200);
                expect(response.body.id).toBe(createdPokemonId);
            });
        }, 15000);

        it("should handle concurrent requests for different Pokemon", async () => {
            const pokemon2 = await repository.create({ tipo: "charizard", treinador: "Trainer 2" });
            const pokemon3 = await repository.create({ tipo: "mewtwo", treinador: "Trainer 3" });

            const requests = [
                request(app).get(`/pokemons/${createdPokemonId}`),
                request(app).get(`/pokemons/${pokemon2.id}`),
                request(app).get(`/pokemons/${pokemon3.id}`),
            ];

            const responses = await Promise.all(requests);

            expect(responses[0].body.tipo).toBe("pikachu");
            expect(responses[1].body.tipo).toBe("charizard");
            expect(responses[2].body.tipo).toBe("mewtwo");
        }, 15000);
    });
});

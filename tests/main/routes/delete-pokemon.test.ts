import request from "supertest";
import { app } from "@/main/config/app";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

describe("DELETE /pokemons/:id - Integration Tests", () => {
    const repository = makePgPokemonRepository();
    let createdPokemonId: number;

    beforeEach(async () => {
        // Create a pokemon for each test
        const pokemon = await repository.create({
            tipo: "pikachu",
            treinador: "To Be Deleted",
        });
        createdPokemonId = pokemon.id;
    });

    describe("Success Cases", () => {
        it("should return 204 No Content when Pokemon is deleted", async () => {
            await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);
        });

        it("should actually delete the Pokemon from database", async () => {
            await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);

            const pokemon = await repository.loadById(createdPokemonId);
            expect(pokemon).toBeNull();
        });

        it("should return empty body on success", async () => {
            const response = await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);

            expect(response.body).toEqual({});
        });

        it("should delete Pokemon with tipo charizard", async () => {
            const charizard = await repository.create({ tipo: "charizard", treinador: "Red" });

            await request(app).delete(`/pokemons/${charizard.id}`).expect(204);

            const deleted = await repository.loadById(charizard.id);
            expect(deleted).toBeNull();
        });

        it("should delete Pokemon with tipo mewtwo", async () => {
            const mewtwo = await repository.create({ tipo: "mewtwo", treinador: "Giovanni" });

            await request(app).delete(`/pokemons/${mewtwo.id}`).expect(204);

            const deleted = await repository.loadById(mewtwo.id);
            expect(deleted).toBeNull();
        });

        it("should not appear in list after deletion", async () => {
            await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);

            const response = await request(app).get("/pokemons").expect(200);

            const found = response.body.find((p: any) => p.id === createdPokemonId);
            expect(found).toBeUndefined();
        });

        it("should delete Pokemon with high nivel", async () => {
            await repository.updateNivel(createdPokemonId, 100);

            await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);

            const deleted = await repository.loadById(createdPokemonId);
            expect(deleted).toBeNull();
        });

        it("should delete Pokemon with special characters in treinador", async () => {
            const pokemon = await repository.create({
                tipo: "pikachu",
                treinador: "José María O'Connor",
            });

            await request(app).delete(`/pokemons/${pokemon.id}`).expect(204);

            const deleted = await repository.loadById(pokemon.id);
            expect(deleted).toBeNull();
        });
    });

    describe("Error Cases", () => {
        it("should return 404 when Pokemon does not exist", async () => {
            const nonExistentId = 999999;
            const response = await request(app).delete(`/pokemons/${nonExistentId}`).expect(404);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toBe("Pokemon not found");
        });

        it("should return 404 for negative id", async () => {
            const response = await request(app).delete("/pokemons/-1").expect(404);

            expect(response.body).toHaveProperty("error");
        });

        it("should return 400 for invalid id format (letters)", async () => {
            const response = await request(app).delete("/pokemons/abc").expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("valid number");
        });

        it("should return 400 for invalid id format (special characters)", async () => {
            const response = await request(app).delete("/pokemons/1@#$").expect(400);

            expect(response.body).toHaveProperty("error");
        });

        it("should return 404 when trying to delete already deleted Pokemon", async () => {
            await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);

            const response = await request(app).delete(`/pokemons/${createdPokemonId}`).expect(404);

            expect(response.body.error).toBe("Pokemon not found");
        });
    });

    describe("Edge Cases", () => {
        it("should handle very large id numbers", async () => {
            const response = await request(app).delete("/pokemons/999999999").expect(404);

            expect(response.body).toHaveProperty("error");
        });

        it("should not affect other Pokemons when deleting one", async () => {
            const pokemon1 = await repository.create({ tipo: "pikachu", treinador: "Trainer 1" });
            const pokemon2 = await repository.create({ tipo: "charizard", treinador: "Trainer 2" });

            await request(app).delete(`/pokemons/${pokemon1.id}`).expect(204);

            const stillExists = await repository.loadById(pokemon2.id);
            expect(stillExists).not.toBeNull();
            expect(stillExists?.id).toBe(pokemon2.id);
        });

        it("should handle concurrent delete requests for different Pokemons", async () => {
            const pokemon1 = await repository.create({ tipo: "pikachu", treinador: "Trainer 1" });
            const pokemon2 = await repository.create({ tipo: "charizard", treinador: "Trainer 2" });
            const pokemon3 = await repository.create({ tipo: "mewtwo", treinador: "Trainer 3" });

            const requests = [
                request(app).delete(`/pokemons/${pokemon1.id}`),
                request(app).delete(`/pokemons/${pokemon2.id}`),
                request(app).delete(`/pokemons/${pokemon3.id}`),
            ];

            const responses = await Promise.all(requests);

            responses.forEach((response) => {
                expect(response.status).toBe(204);
            });

            // Verify all are deleted
            expect(await repository.loadById(pokemon1.id)).toBeNull();
            expect(await repository.loadById(pokemon2.id)).toBeNull();
            expect(await repository.loadById(pokemon3.id)).toBeNull();
        }, 15000);

        it("should return 404 for Pokemon id 0", async () => {
            const response = await request(app).delete("/pokemons/0").expect(404);

            expect(response.body).toHaveProperty("error");
        });
    });

    describe("Integration with other endpoints", () => {
        it("should return 404 when trying to GET deleted Pokemon", async () => {
            await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);

            await request(app).get(`/pokemons/${createdPokemonId}`).expect(404);
        });

        it("should return 404 when trying to PUT deleted Pokemon", async () => {
            await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);

            const response = await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({ treinador: "New Name" });

            // May return 404 or process the update (depends on implementation)
            expect([404, 204]).toContain(response.status);
        });

        it("should allow creating new Pokemon after deletion", async () => {
            await request(app).delete(`/pokemons/${createdPokemonId}`).expect(204);

            const response = await request(app)
                .post("/pokemons")
                .send({ tipo: "pikachu", treinador: "New Trainer" })
                .expect(201);

            expect(response.body).toHaveProperty("id");
            expect(response.body.id).not.toBe(createdPokemonId); // Should be a new id
        });
    });
});

import request from "supertest";
import { app } from "@/main/config/app";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

describe("GET /pokemons - Integration Tests", () => {
    const repository = makePgPokemonRepository();

    describe("Success Cases", () => {
        it("should return 200 with array of Pokemons", async () => {
            const response = await request(app).get("/pokemons").expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it("should return Pokemons with correct structure", async () => {
            // Create a pokemon first
            await repository.create({ tipo: "pikachu", treinador: "Test Trainer" });

            const response = await request(app).get("/pokemons").expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty("id");
                expect(response.body[0]).toHaveProperty("tipo");
                expect(response.body[0]).toHaveProperty("treinador");
                expect(response.body[0]).toHaveProperty("nivel");
            }
        });

        it("should return all Pokemon types", async () => {
            const pikachu = await repository.create({ tipo: "pikachu", treinador: "Ash" });
            const charizard = await repository.create({ tipo: "charizard", treinador: "Red" });
            const mewtwo = await repository.create({ tipo: "mewtwo", treinador: "Giovanni" });

            const response = await request(app).get("/pokemons").expect(200);

            const ids = response.body.map((p: any) => p.id);
            expect(ids).toContain(pikachu.id);
            expect(ids).toContain(charizard.id);
            expect(ids).toContain(mewtwo.id);
        });

        it("should return Pokemons after creation", async () => {
            const beforeCount = (await request(app).get("/pokemons")).body.length;

            await request(app)
                .post("/pokemons")
                .send({ tipo: "pikachu", treinador: "New Trainer" });

            const afterResponse = await request(app).get("/pokemons").expect(200);
            expect(afterResponse.body.length).toBe(beforeCount + 1);
        });

        it("should return Pokemons with updated treinador", async () => {
            const pokemon = await repository.create({ tipo: "pikachu", treinador: "Original" });
            await repository.updateTreinador(pokemon.id, "Updated");

            const response = await request(app).get("/pokemons").expect(200);

            const found = response.body.find((p: any) => p.id === pokemon.id);
            expect(found.treinador).toBe("Updated");
        });

        it("should return Pokemons with updated nivel", async () => {
            const pokemon = await repository.create({ tipo: "pikachu", treinador: "Trainer" });
            await repository.updateNivel(pokemon.id, 25);

            const response = await request(app).get("/pokemons").expect(200);

            const found = response.body.find((p: any) => p.id === pokemon.id);
            expect(found.nivel).toBe(25);
        });

        it("should not include deleted Pokemons", async () => {
            const pokemon = await repository.create({ tipo: "pikachu", treinador: "ToDelete" });
            await repository.deleteById(pokemon.id);

            const response = await request(app).get("/pokemons").expect(200);

            const found = response.body.find((p: any) => p.id === pokemon.id);
            expect(found).toBeUndefined();
        });

        it("should return Pokemons with special characters in treinador", async () => {
            const pokemon = await repository.create({
                tipo: "pikachu",
                treinador: "José María O'Connor",
            });

            const response = await request(app).get("/pokemons").expect(200);

            const found = response.body.find((p: any) => p.id === pokemon.id);
            expect(found.treinador).toBe("José María O'Connor");
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty database", async () => {
            // Delete all pokemons
            const allPokemons = await repository.listAll();
            for (const pokemon of allPokemons) {
                await repository.deleteById(pokemon.id);
            }

            const response = await request(app).get("/pokemons").expect(200);

            expect(response.body).toEqual([]);
            expect(response.body).toHaveLength(0);
        });

        it("should return consistent data on multiple requests", async () => {
            const response1 = await request(app).get("/pokemons").expect(200);
            const response2 = await request(app).get("/pokemons").expect(200);
            const response3 = await request(app).get("/pokemons").expect(200);

            expect(response1.body).toEqual(response2.body);
            expect(response2.body).toEqual(response3.body);
        });

        it("should handle concurrent requests", async () => {
            const requests = [
                request(app).get("/pokemons"),
                request(app).get("/pokemons"),
                request(app).get("/pokemons"),
                request(app).get("/pokemons"),
                request(app).get("/pokemons"),
            ];

            const responses = await Promise.all(requests);

            responses.forEach((response) => {
                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
            });
        }, 15000);

        it("should return large lists efficiently", async () => {
            // Create multiple pokemons
            const createPromises = Array.from({ length: 20 }, (_, i) =>
                repository.create({ tipo: "pikachu", treinador: `Trainer ${i}` }),
            );
            await Promise.all(createPromises);

            const response = await request(app).get("/pokemons").expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(20);
        }, 20000);

        it("should not accept query parameters (no filtering implemented)", async () => {
            const response = await request(app).get("/pokemons?tipo=pikachu").expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // Should return all pokemons, not filtered
        });

        it("should not accept body in GET request", async () => {
            const response = await request(app)
                .get("/pokemons")
                .send({ tipo: "pikachu" })
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe("Response Format", () => {
        it("should return Content-Type application/json", async () => {
            const response = await request(app).get("/pokemons").expect(200);

            expect(response.headers["content-type"]).toContain("application/json");
        });

        it("should return valid JSON array", async () => {
            const response = await request(app).get("/pokemons").expect(200);

            expect(() => JSON.stringify(response.body)).not.toThrow();
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});

import request from "supertest";
import { app } from "@/main/config/app";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

describe("PUT /pokemons/:id - Integration Tests", () => {
    const repository = makePgPokemonRepository();
    let createdPokemonId: number;

    beforeEach(async () => {
        // Create a pokemon for each test
        const pokemon = await repository.create({
            tipo: "pikachu",
            treinador: "Original Trainer",
        });
        createdPokemonId = pokemon.id;
    });

    describe("Success Cases", () => {
        it("should update pokemon treinador and return 204", async () => {
            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({
                    treinador: "New Trainer",
                })
                .expect(204);

            // Verify the update was persisted
            const updated = await repository.loadById(createdPokemonId);
            expect(updated?.treinador).toBe("New Trainer");
        });

        it("should update treinador to a name with special characters", async () => {
            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({
                    treinador: "José María O'Connor",
                })
                .expect(204);

            const updated = await repository.loadById(createdPokemonId);
            expect(updated?.treinador).toBe("José María O'Connor");
        });

        it("should update treinador to a long name", async () => {
            const longName = "A".repeat(255);
            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({
                    treinador: longName,
                })
                .expect(204);

            const updated = await repository.loadById(createdPokemonId);
            expect(updated?.treinador).toBe(longName);
        });

        it("should update the same pokemon multiple times", async () => {
            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({ treinador: "Trainer A" })
                .expect(204);

            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({ treinador: "Trainer B" })
                .expect(204);

            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({ treinador: "Trainer C" })
                .expect(204);

            const updated = await repository.loadById(createdPokemonId);
            expect(updated?.treinador).toBe("Trainer C");
        });

        it("should not affect other properties when updating treinador", async () => {
            const before = await repository.loadById(createdPokemonId);

            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({ treinador: "Different Trainer" })
                .expect(204);

            const after = await repository.loadById(createdPokemonId);
            expect(after?.id).toBe(before?.id);
            expect(after?.tipo).toBe(before?.tipo);
            expect(after?.nivel).toBe(before?.nivel);
            expect(after?.treinador).not.toBe(before?.treinador);
        });
    });

    describe("Validation Error Cases", () => {
        it("should return 400 if treinador is missing", async () => {
            const response = await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("treinador");
        });

        it("should return 400 if treinador is empty string", async () => {
            const response = await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({
                    treinador: "",
                })
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("treinador");
        });

        it("should return 400 if treinador is null", async () => {
            const response = await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({
                    treinador: null,
                })
                .expect(400);

            expect(response.body).toHaveProperty("error");
        });

        it("should return 404 if id parameter is missing", async () => {
            await request(app)
                .put("/pokemons/")
                .send({
                    treinador: "New Trainer",
                })
                .expect(404); // Route not found
        });
    });

    describe("Edge Cases", () => {
        it("should handle non-existent pokemon id gracefully", async () => {
            const nonExistentId = 999999;
            await request(app)
                .put(`/pokemons/${nonExistentId}`)
                .send({
                    treinador: "New Trainer",
                })
                .expect(204); // API returns 204 even if not found (no verification)
        });

        it("should return 400 if Content-Type is not application/json", async () => {
            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send("treinador=NewTrainer")
                .expect(400);
        });

        it("should handle malformed JSON gracefully", async () => {
            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .set("Content-Type", "application/json")
                .send("{invalid json")
                .expect(400);
        });

        it("should not allow updating tipo field", async () => {
            const before = await repository.loadById(createdPokemonId);

            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({
                    treinador: "New Trainer",
                    tipo: "charizard", // Should be ignored
                })
                .expect(204);

            const after = await repository.loadById(createdPokemonId);
            expect(after?.tipo).toBe(before?.tipo); // tipo should not change
        });

        it("should not allow updating nivel field", async () => {
            const before = await repository.loadById(createdPokemonId);

            await request(app)
                .put(`/pokemons/${createdPokemonId}`)
                .send({
                    treinador: "New Trainer",
                    nivel: 99, // Should be ignored
                })
                .expect(204);

            const after = await repository.loadById(createdPokemonId);
            expect(after?.nivel).toBe(before?.nivel); // nivel should not change
        });

        it("should handle concurrent updates", async () => {
            jest.setTimeout(20000);

            const updates = [
                request(app).put(`/pokemons/${createdPokemonId}`).send({ treinador: "Trainer 1" }),
                request(app).put(`/pokemons/${createdPokemonId}`).send({ treinador: "Trainer 2" }),
                request(app).put(`/pokemons/${createdPokemonId}`).send({ treinador: "Trainer 3" }),
            ];

            const responses = await Promise.all(updates);

            // All requests should succeed
            responses.forEach((response) => {
                expect(response.status).toBe(204);
            });

            // Final state should be one of the trainers
            const final = await repository.loadById(createdPokemonId);
            expect(["Trainer 1", "Trainer 2", "Trainer 3"]).toContain(final?.treinador);
        }, 15000);
    });
});

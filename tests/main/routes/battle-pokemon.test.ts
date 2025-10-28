import request from "supertest";
import type { PokemonModel } from "@/domain/contracts/repos";
import { app } from "@/main/config/app";
import { makePgPokemonRepository } from "@/main/factories/infra/repos/postgres/pokemon-repository";

describe("POST /batalhar/:pokemonAId/:pokemonBId - Integration Tests", () => {
    const repository = makePgPokemonRepository();
    let pokemonA: PokemonModel;
    let pokemonB: PokemonModel;

    beforeEach(async () => {
        // Create two pokemons for each test
        pokemonA = await repository.create({
            tipo: "pikachu",
            treinador: "Ash",
        });
        pokemonB = await repository.create({
            tipo: "charizard",
            treinador: "Red",
        });
    });

    afterEach(async () => {
        // Clean up after each test
        try {
            await repository.deleteById(pokemonA.id);
        } catch {
            /* empty block for testing */
        }
        try {
            await repository.deleteById(pokemonB.id);
        } catch {
            /* empty block for testing */
        }
    });

    describe("Success Cases", () => {
        it("should return 200 with vencedor and perdedor", async () => {
            const response = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
                .expect(200);

            expect(response.body).toHaveProperty("vencedor");
            expect(response.body).toHaveProperty("perdedor");
        });

        it("should return vencedor with correct structure", async () => {
            const response = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
                .expect(200);

            expect(response.body.vencedor).toHaveProperty("id");
            expect(response.body.vencedor).toHaveProperty("tipo");
            expect(response.body.vencedor).toHaveProperty("treinador");
            expect(response.body.vencedor).toHaveProperty("nivel");
        });

        it("should return perdedor with correct structure", async () => {
            const response = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
                .expect(200);

            expect(response.body.perdedor).toHaveProperty("id");
            expect(response.body.perdedor).toHaveProperty("tipo");
            expect(response.body.perdedor).toHaveProperty("treinador");
            expect(response.body.perdedor).toHaveProperty("nivel");
        });

        it("should increment vencedor level by 1", async () => {
            const initialLevelA = pokemonA.nivel;
            const initialLevelB = pokemonB.nivel;

            const response = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
                .expect(200);

            const vencedorLevel = response.body.vencedor.nivel;
            const isVencedorA = response.body.vencedor.id === pokemonA.id;

            if (isVencedorA) {
                expect(vencedorLevel).toBe(initialLevelA + 1);
            } else {
                expect(vencedorLevel).toBe(initialLevelB + 1);
            }
        });

        it("should decrement perdedor level by 1", async () => {
            const initialLevelA = pokemonA.nivel;
            const initialLevelB = pokemonB.nivel;

            const response = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
                .expect(200);

            const perdedorLevel = response.body.perdedor.nivel;
            const isPerdedorA = response.body.perdedor.id === pokemonA.id;

            if (isPerdedorA) {
                expect(perdedorLevel).toBe(initialLevelA - 1);
            } else {
                expect(perdedorLevel).toBe(initialLevelB - 1);
            }
        });

        it("should persist level changes in database", async () => {
            const response = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
                .expect(200);

            const vencedorId = response.body.vencedor.id;
            const vencedorFromDb = await repository.loadById(vencedorId);

            expect(vencedorFromDb?.nivel).toBe(response.body.vencedor.nivel);
        });

        it("should delete perdedor if level reaches 0", async () => {
            // Set pokemonB to level 1, so it can be deleted
            await repository.updateNivel(pokemonB.id, 1);
            pokemonB.nivel = 1;

            // Keep trying battles until pokemonB loses (and gets deleted)
            let attempts = 0;
            let wasDeleted = false;

            while (attempts < 20 && !wasDeleted) {
                const response = await request(app)
                    .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
                    .expect(200);

                if (
                    response.body.perdedor.id === pokemonB.id &&
                    response.body.perdedor.nivel === 0
                ) {
                    wasDeleted = true;
                    const perdedorFromDb = await repository.loadById(pokemonB.id);
                    expect(perdedorFromDb).toBeNull();
                }

                attempts++;

                // Reset for next attempt if not deleted
                if (!wasDeleted) {
                    try {
                        await repository.updateNivel(pokemonA.id, 1);
                        await repository.updateNivel(pokemonB.id, 1);
                    } catch {
                        /* empty block for testing */
                    }
                }
            }

            // At least verify the pokemon can be deleted (even if not in this specific battle)
            expect(attempts).toBeLessThan(20);
        });

        it("should work with different pokemon types", async () => {
            const mewtwo = await repository.create({
                tipo: "mewtwo",
                treinador: "Giovanni",
            });

            const response = await request(app)
                .post(`/batalhar/${pokemonA.id}/${mewtwo.id}`)
                .expect(200);

            expect(response.body.vencedor.tipo).toMatch(/pikachu|mewtwo/);
            expect(response.body.perdedor.tipo).toMatch(/pikachu|mewtwo/);

            await repository.deleteById(mewtwo.id);
        });
    });

    describe("Error Cases", () => {
        it("should return 404 if pokemonA does not exist", async () => {
            const response = await request(app).post(`/batalhar/999999/${pokemonB.id}`).expect(404);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toBe("Pokemon not found");
        });

        it("should return 404 if pokemonB does not exist", async () => {
            const response = await request(app).post(`/batalhar/${pokemonA.id}/999999`).expect(404);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toBe("Pokemon not found");
        });

        it("should return 404 if both pokemons do not exist", async () => {
            const response = await request(app).post("/batalhar/999999/888888").expect(404);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toBe("Pokemon not found");
        });

        it("should return 400 if pokemonAId equals pokemonBId", async () => {
            const response = await request(app)
                .post(`/batalhar/${pokemonA.id}/${pokemonA.id}`)
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toBe("Cannot battle the same pokemon");
        });

        it("should return 400 for invalid pokemonAId format", async () => {
            const response = await request(app).post(`/batalhar/abc/${pokemonB.id}`).expect(400);

            expect(response.body).toHaveProperty("error");
        });

        it("should return 400 for invalid pokemonBId format", async () => {
            const response = await request(app).post(`/batalhar/${pokemonA.id}/xyz`).expect(400);

            expect(response.body).toHaveProperty("error");
        });
    });

    describe("Probability Distribution", () => {
        it("should favor pokemon with higher level", async () => {
            // Set dramatically different levels
            await repository.updateNivel(pokemonA.id, 1);
            await repository.updateNivel(pokemonB.id, 10);

            const wins = { pokemonA: 0, pokemonB: 0 };
            const battles = 20;

            for (let i = 0; i < battles; i++) {
                // Check if pokemons still exist before battle
                const a = await repository.loadById(pokemonA.id);
                const b = await repository.loadById(pokemonB.id);

                if (!a || !b) {
                    // If one was deleted, recreate them
                    if (!a) {
                        pokemonA = await repository.create({
                            tipo: "pikachu",
                            treinador: "Ash",
                        });
                    }
                    if (!b) {
                        pokemonB = await repository.create({
                            tipo: "charizard",
                            treinador: "Red",
                        });
                    }
                }

                // Reset levels before battle
                await repository.updateNivel(pokemonA.id, 1);
                await repository.updateNivel(pokemonB.id, 10);

                const response = await request(app)
                    .post(`/batalhar/${pokemonA.id}/${pokemonB.id}`)
                    .expect(200);

                if (response.body.vencedor.id === pokemonA.id) {
                    wins.pokemonA++;
                } else {
                    wins.pokemonB++;
                }
            }

            // PokemonB (level 10) should win significantly more
            expect(wins.pokemonB).toBeGreaterThan(wins.pokemonA);
        });
    });
});

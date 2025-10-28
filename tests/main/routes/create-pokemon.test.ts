import request from "supertest";
import { app } from "@/main/config/app";

describe("POST /pokemons - Integration Tests", () => {
    describe("Success Cases", () => {
        it("should create a pokemon with tipo pikachu and return 201", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "pikachu",
                    treinador: "Ash Ketchum",
                })
                .expect(201);

            expect(response.body).toHaveProperty("id");
            expect(response.body.tipo).toBe("pikachu");
            expect(response.body.treinador).toBe("Ash Ketchum");
            expect(response.body.nivel).toBe(1);
        });

        it("should create a pokemon with tipo charizard and return 201", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "charizard",
                    treinador: "Red",
                })
                .expect(201);

            expect(response.body).toHaveProperty("id");
            expect(response.body.tipo).toBe("charizard");
            expect(response.body.treinador).toBe("Red");
            expect(response.body.nivel).toBe(1);
        });

        it("should create a pokemon with tipo mewtwo and return 201", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "mewtwo",
                    treinador: "Giovanni",
                })
                .expect(201);

            expect(response.body).toHaveProperty("id");
            expect(response.body.tipo).toBe("mewtwo");
            expect(response.body.treinador).toBe("Giovanni");
            expect(response.body.nivel).toBe(1);
        });

        it("should create pokemon with treinador containing special characters", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "pikachu",
                    treinador: "José da Silva-Santos",
                })
                .expect(201);

            expect(response.body.treinador).toBe("José da Silva-Santos");
        });
    });

    describe("Validation Error Cases", () => {
        it("should return 400 if tipo is missing", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    treinador: "Ash",
                })
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("tipo");
        });

        it("should return 400 if tipo is empty string", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "",
                    treinador: "Ash",
                })
                .expect(400);

            expect(response.body).toHaveProperty("error");
        });

        it("should return 400 if tipo is invalid", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "bulbasaur",
                    treinador: "Ash",
                })
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("pikachu");
            expect(response.body.error).toContain("charizard");
            expect(response.body.error).toContain("mewtwo");
        });

        it("should return 400 if treinador is missing", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "pikachu",
                })
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("treinador");
        });

        it("should return 400 if treinador is empty string", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "pikachu",
                    treinador: "",
                })
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("treinador");
        });

        it("should return 400 if nivel is provided", async () => {
            const response = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "pikachu",
                    treinador: "Ash",
                    nivel: 10,
                })
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("nivel");
        });

        it("should return 400 if both tipo and treinador are missing", async () => {
            const response = await request(app).post("/pokemons").send({}).expect(400);

            expect(response.body).toHaveProperty("error");
        });
    });

    describe("Edge Cases", () => {
        it("should return 400 if Content-Type is not application/json", async () => {
            await request(app).post("/pokemons").send("tipo=pikachu&treinador=Ash").expect(400);
        });

        it("should handle malformed JSON gracefully", async () => {
            await request(app)
                .post("/pokemons")
                .set("Content-Type", "application/json")
                .send("{invalid json")
                .expect(400);
        });

        it("should create multiple pokemons independently", async () => {
            const response1 = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "pikachu",
                    treinador: "Trainer 1",
                })
                .expect(201);

            const response2 = await request(app)
                .post("/pokemons")
                .send({
                    tipo: "charizard",
                    treinador: "Trainer 2",
                })
                .expect(201);

            expect(response1.body.id).not.toBe(response2.body.id);
            expect(response1.body.treinador).toBe("Trainer 1");
            expect(response2.body.treinador).toBe("Trainer 2");
        });
    });
});

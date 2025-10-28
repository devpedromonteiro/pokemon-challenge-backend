import { Controller } from "@/application/controllers";
import { UpdatePokemonTreinadorController } from "@/application/controllers/pokemon";
import { noContent, notFound } from "@/application/helpers";

describe("UpdatePokemonTreinadorController", () => {
    let sut: UpdatePokemonTreinadorController;
    let updatePokemonTreinador: jest.Mock;

    beforeAll(() => {
        updatePokemonTreinador = jest.fn();
        updatePokemonTreinador.mockResolvedValue(undefined);
    });

    beforeEach(() => {
        sut = new UpdatePokemonTreinadorController(updatePokemonTreinador);
    });

    it("should extend Controller", () => {
        expect(sut).toBeInstanceOf(Controller);
    });

    describe("buildValidators", () => {
        it("should return error if id is missing", async () => {
            const httpRequest = { treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if id is empty string", async () => {
            const httpRequest = { id: "", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if treinador is missing", async () => {
            const httpRequest = { id: "1" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should return error if treinador is empty string", async () => {
            const httpRequest = { id: "1", treinador: "" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(400);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });
    });

    describe("perform", () => {
        it("should call UpdatePokemonTreinador use case with correct params", async () => {
            const httpRequest = { id: "1", treinador: "Gary" };

            await sut.handle(httpRequest);

            expect(updatePokemonTreinador).toHaveBeenCalledWith({ id: 1, treinador: "Gary" });
            expect(updatePokemonTreinador).toHaveBeenCalledTimes(1);
        });

        it("should return 204 No Content on success", async () => {
            const httpRequest = { id: "1", treinador: "Gary" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse).toEqual(noContent());
        });

        it("should call use case with numeric string id", async () => {
            const httpRequest = { id: "42", treinador: "Misty" };

            await sut.handle(httpRequest);

            expect(updatePokemonTreinador).toHaveBeenCalledWith({ id: 42, treinador: "Misty" });
        });

        it("should return 404 if Pokemon not found", async () => {
            updatePokemonTreinador.mockRejectedValueOnce(new Error("Pokemon not found"));

            const httpRequest = { id: "999", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse).toEqual(notFound(new Error("Pokemon not found")));
        });

        it("should return 500 if use case throws other error", async () => {
            const genericError = new Error("Database error");
            updatePokemonTreinador.mockRejectedValueOnce(genericError);

            const httpRequest = { id: "1", treinador: "Ash" };

            const httpResponse = await sut.handle(httpRequest);

            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse.data).toBeInstanceOf(Error);
            expect(httpResponse.data.message).toBe("Server failed. Try again soon");
        });

        it("should handle large id numbers", async () => {
            const largeId = "999999999";
            const httpRequest = { id: largeId, treinador: "Trainer" };

            await sut.handle(httpRequest);

            expect(updatePokemonTreinador).toHaveBeenCalledWith({
                id: Number(largeId),
                treinador: "Trainer",
            });
        });
    });
});

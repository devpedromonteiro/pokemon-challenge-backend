import { Controller } from "@/application/controllers";
import { DeletePokemonController } from "@/application/controllers/pokemon";
import { noContent, notFound } from "@/application/helpers";

describe("DeletePokemonController", () => {
    let sut: DeletePokemonController;
    let deletePokemon: jest.Mock;

    beforeAll(() => {
        deletePokemon = jest.fn();
    });

    beforeEach(() => {
        sut = new DeletePokemonController(deletePokemon);
    });

    it("should extend Controller", () => {
        expect(sut).toBeInstanceOf(Controller);
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
        it("should call DeletePokemon use case with correct id", async () => {
            await sut.handle({ id: "1" });

            expect(deletePokemon).toHaveBeenCalledWith({ id: 1 });
            expect(deletePokemon).toHaveBeenCalledTimes(1);
        });

        it("should return 204 No Content on success", async () => {
            const httpResponse = await sut.handle({ id: "1" });

            expect(httpResponse).toEqual(noContent());
            expect(httpResponse.statusCode).toBe(204);
            expect(httpResponse.data).toBeNull();
        });

        it("should delete pokemon with numeric string id", async () => {
            await sut.handle({ id: "42" });

            expect(deletePokemon).toHaveBeenCalledWith({ id: 42 });
        });

        it("should work with large id numbers", async () => {
            await sut.handle({ id: "999999" });

            expect(deletePokemon).toHaveBeenCalledWith({ id: 999999 });
        });

        it("should return 404 when Pokemon is not found", async () => {
            deletePokemon.mockRejectedValueOnce(new Error("Pokemon not found"));

            const httpResponse = await sut.handle({ id: "999" });

            expect(httpResponse.statusCode).toBe(404);
            expect(httpResponse.data).toBeInstanceOf(Error);
            expect((httpResponse.data as Error).message).toBe("Pokemon not found");
        });

        it("should return 404 with notFound helper", async () => {
            const error = new Error("Pokemon not found");
            deletePokemon.mockRejectedValueOnce(error);

            const httpResponse = await sut.handle({ id: "999" });

            expect(httpResponse).toEqual(notFound(error));
        });

        it("should return 500 if use case throws unexpected error", async () => {
            deletePokemon.mockRejectedValueOnce(new Error("Database error"));

            const httpResponse = await sut.handle({ id: "1" });

            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse.data).toBeInstanceOf(Error);
        });

        it("should rethrow unexpected errors", async () => {
            const unexpectedError = new Error("Unexpected error");
            deletePokemon.mockRejectedValueOnce(unexpectedError);

            const httpResponse = await sut.handle({ id: "1" });

            expect(httpResponse.statusCode).toBe(500);
        });
    });
});

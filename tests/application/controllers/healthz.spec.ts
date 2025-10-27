import { Controller, HealthzController } from "@/application/controllers";

describe("HealthzController", () => {
    let sut: HealthzController;

    beforeEach(() => {
        sut = new HealthzController();
    });

    it("should extend Controller", async () => {
        expect(sut).toBeInstanceOf(Controller);
    });

    it("should return 200 if authentication succeeds", async () => {
        const httpResponse = await sut.handle({});

        expect(httpResponse).toEqual({
            statusCode: 200,
            data: {
                status: "ok",
                uptimeSeconds: expect.any(Number),
                version: "1.0.0",
            },
        });
    });
});

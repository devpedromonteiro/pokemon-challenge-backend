import { getErrorMessage } from "../../../src/main/utils/get-error-message";

type SutTypes = {
    sut: (error: unknown) => string;
};

const makeSut = (): SutTypes => {
    const sut = getErrorMessage;
    return { sut };
};

describe("getErrorMessage", () => {
    test("Should return the .message when error is an instance of Error", () => {
        // Arrange
        const { sut } = makeSut();
        const input = new Error("boom");

        // Act
        const result = sut(input);

        // Assert
        expect(result).toBe("boom");
    });

    test("Should return the .message when error is a plain object with message", () => {
        // Arrange
        const { sut } = makeSut();
        const input = { message: "custom" };

        // Act
        const result = sut(input);

        // Assert
        expect(result).toBe(input.message);
    });

    test("Should stringify non-error primitives", () => {
        // Arrange
        const { sut } = makeSut();

        // Act & Assert
        expect(sut(123)).toBe("123");
        expect(sut("abc")).toBe("abc");
        expect(sut(true)).toBe("true");
        expect(sut(false)).toBe("false");
    });

    test('Should return "Unknown error" if String() throws', () => {
        // Arrange
        const { sut } = makeSut();
        const problematic = {
            toString: () => {
                throw new Error("fail");
            },
        };

        // Act
        const result = sut(problematic);

        // Assert
        expect(result).toBe("Unknown error");
    });

    test("Should never throw even with weird inputs", () => {
        // Arrange
        const { sut } = makeSut();
        const weirdValues = [
            null,
            undefined,
            Symbol("x"),
            () => {},
            BigInt(10),
        ];

        // Act
        for (const value of weirdValues) {
            // Assert
            expect(() => sut(value)).not.toThrow();
            expect(typeof sut(value)).toBe("string");
        }
    });
});

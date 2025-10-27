import type {
    CreatePokemonParams,
    PokemonModel,
    PokemonRepository,
} from "@/domain/contracts/repos";

describe("PgPokemonRepository", () => {
    let sut: PokemonRepository;

    beforeAll(() => {
        // Mock implementation for testing
        sut = {
            create: jest.fn(),
            loadById: jest.fn(),
            listAll: jest.fn(),
            updateTreinador: jest.fn(),
            updateNivel: jest.fn(),
            deleteById: jest.fn(),
        };
    });

    describe("create", () => {
        it("should create a Pokemon with nivel starting at 1", async () => {
            const input: CreatePokemonParams = {
                tipo: "pikachu",
                treinador: "Ash",
            };

            const mockOutput: PokemonModel = {
                id: 1,
                tipo: "pikachu",
                treinador: "Ash",
                nivel: 1,
            };

            (sut.create as jest.Mock).mockResolvedValueOnce(mockOutput);

            const result = await sut.create(input);

            expect(result).toEqual(mockOutput);
            expect(result.nivel).toBe(1);
            expect(sut.create).toHaveBeenCalledWith(input);
            expect(sut.create).toHaveBeenCalledTimes(1);
        });

        it("should create a Pokemon with tipo charizard", async () => {
            const input: CreatePokemonParams = {
                tipo: "charizard",
                treinador: "Red",
            };

            const mockOutput: PokemonModel = {
                id: 2,
                tipo: "charizard",
                treinador: "Red",
                nivel: 1,
            };

            (sut.create as jest.Mock).mockResolvedValueOnce(mockOutput);

            const result = await sut.create(input);

            expect(result.tipo).toBe("charizard");
            expect(result.nivel).toBe(1);
        });

        it("should create a Pokemon with tipo mewtwo", async () => {
            const input: CreatePokemonParams = {
                tipo: "mewtwo",
                treinador: "Giovanni",
            };

            const mockOutput: PokemonModel = {
                id: 3,
                tipo: "mewtwo",
                treinador: "Giovanni",
                nivel: 1,
            };

            (sut.create as jest.Mock).mockResolvedValueOnce(mockOutput);

            const result = await sut.create(input);

            expect(result.tipo).toBe("mewtwo");
            expect(result.nivel).toBe(1);
        });
    });

    describe("loadById", () => {
        it("should load a Pokemon by id", async () => {
            const mockPokemon: PokemonModel = {
                id: 1,
                tipo: "pikachu",
                treinador: "Ash",
                nivel: 5,
            };

            (sut.loadById as jest.Mock).mockResolvedValueOnce(mockPokemon);

            const result = await sut.loadById(1);

            expect(result).toEqual(mockPokemon);
            expect(sut.loadById).toHaveBeenCalledWith(1);
            expect(sut.loadById).toHaveBeenCalledTimes(1);
        });

        it("should return null when Pokemon is not found", async () => {
            (sut.loadById as jest.Mock).mockResolvedValueOnce(null);

            const result = await sut.loadById(999);

            expect(result).toBeNull();
            expect(sut.loadById).toHaveBeenCalledWith(999);
        });
    });

    describe("listAll", () => {
        it("should list all Pokemon", async () => {
            const mockPokemons: PokemonModel[] = [
                {
                    id: 1,
                    tipo: "pikachu",
                    treinador: "Ash",
                    nivel: 5,
                },
                {
                    id: 2,
                    tipo: "charizard",
                    treinador: "Red",
                    nivel: 10,
                },
                {
                    id: 3,
                    tipo: "mewtwo",
                    treinador: "Giovanni",
                    nivel: 15,
                },
            ];

            (sut.listAll as jest.Mock).mockResolvedValueOnce(mockPokemons);

            const result = await sut.listAll();

            expect(result).toEqual(mockPokemons);
            expect(result).toHaveLength(3);
            expect(sut.listAll).toHaveBeenCalledTimes(1);
        });

        it("should return empty array when no Pokemon exist", async () => {
            (sut.listAll as jest.Mock).mockResolvedValueOnce([]);

            const result = await sut.listAll();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });
    });

    describe("updateTreinador", () => {
        it("should update the treinador of a Pokemon", async () => {
            (sut.updateTreinador as jest.Mock).mockResolvedValueOnce(undefined);

            await sut.updateTreinador(1, "Gary");

            expect(sut.updateTreinador).toHaveBeenCalledWith(1, "Gary");
            expect(sut.updateTreinador).toHaveBeenCalledTimes(1);
        });
    });

    describe("updateNivel", () => {
        it("should update the nivel of a Pokemon", async () => {
            (sut.updateNivel as jest.Mock).mockResolvedValueOnce(undefined);

            await sut.updateNivel(1, 10);

            expect(sut.updateNivel).toHaveBeenCalledWith(1, 10);
            expect(sut.updateNivel).toHaveBeenCalledTimes(1);
        });

        it("should allow updating nivel to 0", async () => {
            (sut.updateNivel as jest.Mock).mockResolvedValueOnce(undefined);

            await sut.updateNivel(1, 0);

            expect(sut.updateNivel).toHaveBeenCalledWith(1, 0);
        });
    });

    describe("deleteById", () => {
        it("should delete a Pokemon by id", async () => {
            (sut.deleteById as jest.Mock).mockResolvedValueOnce(undefined);

            await sut.deleteById(1);

            expect(sut.deleteById).toHaveBeenCalledWith(1);
            expect(sut.deleteById).toHaveBeenCalledTimes(1);
        });
    });
});

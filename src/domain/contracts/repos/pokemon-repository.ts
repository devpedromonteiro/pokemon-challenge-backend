/**
 * Pokemon types allowed
 */
export type PokemonType = "pikachu" | "charizard" | "mewtwo";

/**
 * Pokemon model following the challenge specification
 */
export interface PokemonModel {
    id: number;
    tipo: PokemonType;
    treinador: string;
    nivel: number;
}

/**
 * Parameters for creating a new Pokemon
 * Note: nivel is not included as it always starts at 1
 */
export interface CreatePokemonParams {
    tipo: PokemonType;
    treinador: string;
}

/**
 * Pokemon repository contract
 * Defines all operations for managing Pokemon entities
 */
export interface PokemonRepository {
    /**
     * Creates a new Pokemon
     * @param data - Pokemon data (tipo and treinador)
     * @returns Promise that resolves to the created Pokemon
     */
    create(data: CreatePokemonParams): Promise<PokemonModel>;

    /**
     * Loads a Pokemon by ID
     * @param id - Pokemon ID
     * @returns Promise that resolves to the Pokemon or null if not found
     */
    loadById(id: number): Promise<PokemonModel | null>;

    /**
     * Lists all Pokemon
     * @returns Promise that resolves to an array of all Pokemon
     */
    listAll(): Promise<PokemonModel[]>;

    /**
     * Updates the treinador of a Pokemon
     * @param id - Pokemon ID
     * @param treinador - New treinador name
     * @returns Promise that resolves when update is complete
     */
    updateTreinador(id: number, treinador: string): Promise<void>;

    /**
     * Updates the nivel of a Pokemon
     * @param id - Pokemon ID
     * @param nivel - New nivel value
     * @returns Promise that resolves when update is complete
     */
    updateNivel(id: number, nivel: number): Promise<void>;

    /**
     * Deletes a Pokemon by ID
     * @param id - Pokemon ID
     * @returns Promise that resolves when deletion is complete
     */
    deleteById(id: number): Promise<void>;
}

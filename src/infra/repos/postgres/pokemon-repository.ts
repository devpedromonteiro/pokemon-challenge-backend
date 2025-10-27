import { eq } from "drizzle-orm";
import type {
    CreatePokemonParams,
    PokemonModel,
    PokemonRepository,
} from "../../../domain/contracts/repos";
import { PgRepository } from "./repository";
import { pokemons } from "./schemas";

/**
 * PostgreSQL implementation of Pokemon repository
 * Implements the PokemonRepository contract using Drizzle ORM
 */
export class PgPokemonRepository extends PgRepository implements PokemonRepository {
    /**
     * Creates a new Pokemon
     * @param data - Pokemon data (tipo and treinador)
     * @returns Promise that resolves to the created Pokemon with nivel starting at 1
     */
    async create(data: CreatePokemonParams): Promise<PokemonModel> {
        const db = this.getDb();
        const result = await db
            .insert(pokemons)
            .values({
                tipo: data.tipo,
                treinador: data.treinador,
                // nivel will be set to default value (1) by the database
            })
            .returning();

        return {
            id: result[0].id,
            tipo: result[0].tipo as "pikachu" | "charizard" | "mewtwo",
            treinador: result[0].treinador,
            nivel: result[0].nivel,
        };
    }

    /**
     * Loads a Pokemon by ID
     * @param id - Pokemon ID
     * @returns Promise that resolves to the Pokemon or null if not found
     */
    async loadById(id: number): Promise<PokemonModel | null> {
        const db = this.getDb();
        const result = await db.select().from(pokemons).where(eq(pokemons.id, id)).limit(1);

        if (!result[0]) {
            return null;
        }

        return {
            id: result[0].id,
            tipo: result[0].tipo as "pikachu" | "charizard" | "mewtwo",
            treinador: result[0].treinador,
            nivel: result[0].nivel,
        };
    }

    /**
     * Lists all Pokemon
     * @returns Promise that resolves to an array of all Pokemon
     */
    async listAll(): Promise<PokemonModel[]> {
        const db = this.getDb();
        const result = await db.select().from(pokemons);

        return result.map((row) => ({
            id: row.id,
            tipo: row.tipo as "pikachu" | "charizard" | "mewtwo",
            treinador: row.treinador,
            nivel: row.nivel,
        }));
    }

    /**
     * Updates the treinador of a Pokemon
     * @param id - Pokemon ID
     * @param treinador - New treinador name
     * @returns Promise that resolves when update is complete
     */
    async updateTreinador(id: number, treinador: string): Promise<void> {
        const db = this.getDb();
        await db.update(pokemons).set({ treinador }).where(eq(pokemons.id, id));
    }

    /**
     * Updates the nivel of a Pokemon
     * @param id - Pokemon ID
     * @param nivel - New nivel value
     * @returns Promise that resolves when update is complete
     */
    async updateNivel(id: number, nivel: number): Promise<void> {
        const db = this.getDb();
        await db.update(pokemons).set({ nivel }).where(eq(pokemons.id, id));
    }

    /**
     * Deletes a Pokemon by ID
     * @param id - Pokemon ID
     * @returns Promise that resolves when deletion is complete
     */
    async deleteById(id: number): Promise<void> {
        const db = this.getDb();
        await db.delete(pokemons).where(eq(pokemons.id, id));
    }
}

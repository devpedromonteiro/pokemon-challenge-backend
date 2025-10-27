import { sql } from "drizzle-orm";
import { check, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

/**
 * Tabela de Pokémons.
 *
 * Regras refletidas aqui:
 * - `tipo` só aceita "pikachu", "charizard" ou "mewtwo"
 * - `nivel` começa em 1
 * - `nivel` nunca pode ser < 0
 */
export const pokemons = pgTable(
    "pokemons",
    {
        id: serial("id").primaryKey(),

        tipo: varchar("tipo", { length: 50 }).notNull(),

        treinador: varchar("treinador", { length: 255 }).notNull(),

        nivel: integer("nivel").notNull().default(1),
    },
    (table) => {
        return {
            tipoValido: check(
                "tipo_valido",
                sql`${table.tipo} IN ('pikachu', 'charizard', 'mewtwo')`,
            ),
            nivelNaoNegativo: check("nivel_nao_negativo", sql`${table.nivel} >= 0`),
        };
    },
);

export type PokemonRow = typeof pokemons.$inferSelect;
export type NewPokemonRow = typeof pokemons.$inferInsert;

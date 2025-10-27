CREATE TABLE "pokemons" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"treinador" varchar(255) NOT NULL,
	"nivel" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "tipo_valido" CHECK ("pokemons"."tipo" IN ('pikachu', 'charizard', 'mewtwo')),
	CONSTRAINT "nivel_nao_negativo" CHECK ("pokemons"."nivel" >= 0)
);

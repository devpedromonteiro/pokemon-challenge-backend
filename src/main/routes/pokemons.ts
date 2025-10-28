import type { Router } from "express";
import { adaptExpressRoute } from "@/main/adapters";
import {
    makeCreatePokemonController,
    makeLoadPokemonByIdController,
    makeUpdatePokemonTreinadorController,
} from "@/main/factories/application/controllers";

export default (router: Router): void => {
    router.post("/pokemons", adaptExpressRoute(makeCreatePokemonController()));
    router.get("/pokemons/:id", adaptExpressRoute(makeLoadPokemonByIdController()));
    router.put("/pokemons/:id", adaptExpressRoute(makeUpdatePokemonTreinadorController()));
};

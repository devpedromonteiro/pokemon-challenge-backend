import type { Router } from "express";
import { adaptExpressRoute } from "@/main/adapters";
import { makeCreatePokemonController } from "@/main/factories/application/controllers";

export default (router: Router): void => {
    router.post("/pokemons", adaptExpressRoute(makeCreatePokemonController()));
};

import type { Router } from "express";
import { adaptExpressRoute } from "@/main/adapters";
import { makeBattlePokemonController } from "@/main/factories/application/controllers";

export default (router: Router): void => {
    router.post(
        "/batalhar/:pokemonAId/:pokemonBId",
        adaptExpressRoute(makeBattlePokemonController()),
    );
};

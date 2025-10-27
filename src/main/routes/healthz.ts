import type { Router } from "express";
import { adaptExpressRoute as adapt } from "@/main/adapters";
import { makeHealthzController } from "@/main/factories/application/controllers";

export default (router: Router): void => {
    router.get("/healthz", adapt(makeHealthzController()));
};

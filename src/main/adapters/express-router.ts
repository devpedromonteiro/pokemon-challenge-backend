import type { RequestHandler } from "express";
import type { Controller } from "@/application/controllers";

type Adapter = (controller: Controller) => RequestHandler;

export const adaptExpressRoute: Adapter = (controller) => async (req, res) => {
    const { statusCode, data } = await controller.handle({
        ...req.body,
        ...req.params,
        ...req.locals,
    });

    const json = [200, 201, 204].includes(statusCode) ? data : { error: data.message };

    res.status(statusCode).json(json);
};

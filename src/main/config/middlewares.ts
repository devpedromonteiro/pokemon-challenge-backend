import express, { type Express } from "express";
import helmet from "helmet";

export const applyMiddlewares = (app: Express): void => {
    app.use(express.json());
    app.use(helmet());
    app.use((_req, res, next) => {
        res.type("json");
        next();
    });
};

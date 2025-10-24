import express, { Express } from "express";
import helmet from "helmet";

export const applyMiddlewares = (app: Express): void => {
    app.use(express.json());
    app.use(helmet());
    app.use((req, res, next) => {
        res.type("json");
        next();
    });
};


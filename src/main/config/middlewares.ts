import express, { Express } from "express";
import helmet from "helmet";

export const applyMiddlewares = (app: Express): void  => {
    app.use(express.json());
    app.use(helmet());
};


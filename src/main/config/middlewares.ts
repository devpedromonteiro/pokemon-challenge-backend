import express, { Express } from "express";
import helmet from "helmet";

export default function applyMiddlewares(app: Express): void {
    app.use(express.json());
    app.use(helmet());
}   


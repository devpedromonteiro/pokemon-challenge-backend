import { Controller } from "@/application/controllers";
import { type HttpResponse, ok } from "@/application/helpers";

type Model = Error | { status: string; uptimeSeconds: number; version: string };

export class HealthzController extends Controller {
    async perform(): Promise<HttpResponse<Model>> {
        return ok({
            status: "ok",
            uptimeSeconds: Number(process.uptime().toFixed(2)),
            version: "1.0.0",
        });
    }
}

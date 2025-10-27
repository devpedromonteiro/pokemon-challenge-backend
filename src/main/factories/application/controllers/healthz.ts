import { HealthzController } from "@/application/controllers";

export const makeHealthzController = (): HealthzController => {
    return new HealthzController();
};

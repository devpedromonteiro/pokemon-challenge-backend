import { Controller } from "@/application/controllers";
import { type HttpResponse, noContent, notFound } from "@/application/helpers";
import { RequiredString, type Validator } from "@/application/validation";
import type { UpdatePokemonTreinador } from "@/domain/use-cases";

type HttpRequest = {
    id?: string;
    treinador?: string;
};

type Model = Error | null;

/**
 * Controller for updating a Pokemon's treinador
 */
export class UpdatePokemonTreinadorController extends Controller {
    constructor(private readonly updatePokemonTreinador: UpdatePokemonTreinador) {
        super();
    }

    /**
     * Build validators for the request
     * @param httpRequest - HTTP request data
     * @returns Array of validators
     */
    override buildValidators(httpRequest: HttpRequest): Validator[] {
        return [
            new RequiredString(httpRequest.id ?? "", "id"),
            new RequiredString(httpRequest.treinador ?? "", "treinador"),
        ];
    }

    /**
     * Perform the update of a Pokemon's treinador
     * @param httpRequest - HTTP request data
     * @returns HTTP response with no content or error
     */
    async perform(httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        const id = Number(httpRequest.id);
        const { treinador } = httpRequest;

        try {
            await this.updatePokemonTreinador({ id, treinador: treinador as string });
            return noContent();
        } catch (error) {
            if (error instanceof Error && error.message === "Pokemon not found") {
                return notFound(error);
            }
            throw error;
        }
    }
}

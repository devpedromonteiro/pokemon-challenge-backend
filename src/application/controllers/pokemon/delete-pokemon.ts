import { Controller } from "@/application/controllers";
import { ValidationError } from "@/application/errors";
import { type HttpResponse, noContent, notFound } from "@/application/helpers";
import type { Validator } from "@/application/validation";
import { RequiredString } from "@/application/validation";
import type { DeletePokemon } from "@/domain/use-cases";

type HttpRequest = {
    id?: string;
};

type Model = Error | null;

/**
 * Controller for deleting a Pokemon
 */
export class DeletePokemonController extends Controller {
    constructor(private readonly deletePokemon: DeletePokemon) {
        super();
    }

    /**
     * Build validators for the request
     * @param httpRequest - HTTP request data
     * @returns Array of validators
     */
    override buildValidators(httpRequest: HttpRequest): Validator[] {
        const validators: Validator[] = [new RequiredString(httpRequest.id ?? "", "id")];

        // Validate that id is a valid number
        const id = httpRequest.id;
        if (id && Number.isNaN(Number(id))) {
            validators.push({
                validate: () => new ValidationError("id must be a valid number"),
            });
        }

        return validators;
    }

    /**
     * Perform the deletion of a Pokemon
     * @param httpRequest - HTTP request data
     * @returns HTTP response with no content or error
     */
    async perform(httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        const id = Number(httpRequest.id);

        try {
            await this.deletePokemon({ id });
            return noContent();
        } catch (error) {
            if (error instanceof Error && error.message === "Pokemon not found") {
                return notFound(error);
            }
            throw error;
        }
    }
}

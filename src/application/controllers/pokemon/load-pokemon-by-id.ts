import { Controller } from "@/application/controllers";
import { ValidationError } from "@/application/errors";
import { type HttpResponse, notFound, ok } from "@/application/helpers";
import type { Validator } from "@/application/validation";
import { RequiredString } from "@/application/validation";
import type { PokemonModel } from "@/domain/contracts/repos";
import type { LoadPokemonById } from "@/domain/use-cases";

type HttpRequest = {
    id?: string;
};

type Model = Error | PokemonModel;

/**
 * Controller for loading a Pokemon by ID
 */
export class LoadPokemonByIdController extends Controller {
    constructor(private readonly loadPokemonById: LoadPokemonById) {
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
     * Perform the loading of a Pokemon by ID
     * @param httpRequest - HTTP request data
     * @returns HTTP response with Pokemon data or error
     */
    async perform(httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        const id = Number(httpRequest.id);

        const pokemon = await this.loadPokemonById({ id });

        if (!pokemon) {
            return notFound(new Error("Pokemon not found"));
        }

        return ok(pokemon);
    }
}

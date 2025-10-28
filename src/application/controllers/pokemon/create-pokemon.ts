import { Controller } from "@/application/controllers";
import { created, type HttpResponse } from "@/application/helpers";
import {
    AllowedValues,
    ForbiddenField,
    RequiredString,
    type Validator,
} from "@/application/validation";
import type { PokemonModel } from "@/domain/contracts/repos";
import type { CreatePokemon } from "@/domain/use-cases";

type HttpRequest = {
    tipo?: string;
    treinador?: string;
    nivel?: number;
};

type Model = Error | PokemonModel;

/**
 * Controller for creating a new Pokemon
 */
export class CreatePokemonController extends Controller {
    constructor(private readonly createPokemon: CreatePokemon) {
        super();
    }

    /**
     * Build validators for the request
     * @param httpRequest - HTTP request data
     * @returns Array of validators
     */
    override buildValidators(httpRequest: HttpRequest): Validator[] {
        const ALLOWED_TIPOS = ["pikachu", "charizard", "mewtwo"];

        return [
            new RequiredString(httpRequest.tipo ?? "", "tipo"),
            new AllowedValues(httpRequest.tipo, ALLOWED_TIPOS, "tipo"),
            new RequiredString(httpRequest.treinador ?? "", "treinador"),
            new ForbiddenField(httpRequest.nivel, "nivel"),
        ];
    }

    /**
     * Perform the creation of a Pokemon
     * @param httpRequest - HTTP request data
     * @returns HTTP response with created Pokemon or error
     */
    async perform(httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        const { tipo, treinador } = httpRequest;

        const pokemon = await this.createPokemon({
            tipo: tipo as "pikachu" | "charizard" | "mewtwo",
            treinador: treinador as string,
        });

        return created(pokemon);
    }
}

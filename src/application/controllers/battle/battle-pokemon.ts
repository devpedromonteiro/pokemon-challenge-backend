import { Controller } from "@/application/controllers";
import { ValidationError } from "@/application/errors";
import { badRequest, type HttpResponse, notFound, ok } from "@/application/helpers";
import { RequiredNumber, type Validator } from "@/application/validation";
import type { PokemonModel } from "@/domain/contracts/repos";
import type { BattlePokemon } from "@/domain/use-cases";

type HttpRequest = {
    pokemonAId: string;
    pokemonBId: string;
};

type Model =
    | Error
    | {
          vencedor: PokemonModel;
          perdedor: PokemonModel;
      };

/**
 * Controller for pokemon battle
 */
export class BattlePokemonController extends Controller {
    constructor(private readonly battlePokemon: BattlePokemon) {
        super();
    }

    /**
     * Build validators for the request
     * @param httpRequest - HTTP request data
     * @returns Array of validators
     */
    override buildValidators(httpRequest: HttpRequest): Validator[] {
        const pokemonAId = Number(httpRequest.pokemonAId);
        const pokemonBId = Number(httpRequest.pokemonBId);

        const validators: Validator[] = [
            new RequiredNumber(pokemonAId, "pokemonAId"),
            new RequiredNumber(pokemonBId, "pokemonBId"),
        ];

        // Validate IDs are different
        if (pokemonAId === pokemonBId && !Number.isNaN(pokemonAId)) {
            validators.push({
                validate: () => new ValidationError("Cannot battle the same pokemon"),
            });
        }

        return validators;
    }

    /**
     * Perform the battle between two pokemons
     * @param httpRequest - HTTP request data
     * @returns HTTP response with battle result or error
     */
    async perform(httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        const pokemonAId = Number(httpRequest.pokemonAId);
        const pokemonBId = Number(httpRequest.pokemonBId);

        try {
            const result = await this.battlePokemon({ pokemonAId, pokemonBId });
            return ok(result);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === "Pokemon not found") {
                    return notFound(error);
                }
                if (error.message === "Cannot battle the same pokemon") {
                    return badRequest(error);
                }
            }
            throw error;
        }
    }
}

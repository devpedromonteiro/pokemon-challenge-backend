import { Controller } from "@/application/controllers";
import { type HttpResponse, ok } from "@/application/helpers";
import type { Validator } from "@/application/validation";
import type { PokemonModel, PokemonRepository } from "@/domain/contracts/repos";

type HttpRequest = Record<string, never>;

type Model = PokemonModel[];

/**
 * Controller for listing all Pokemons
 */
export class ListPokemonsController extends Controller {
    constructor(private readonly pokemonRepository: PokemonRepository) {
        super();
    }

    /**
     * Build validators for the request
     * @param _httpRequest - HTTP request data (no validation needed)
     * @returns Empty array (no validation required)
     */
    override buildValidators(_httpRequest: HttpRequest): Validator[] {
        return [];
    }

    /**
     * Perform the listing of all Pokemons
     * @param _httpRequest - HTTP request data
     * @returns HTTP response with array of Pokemons
     */
    async perform(_httpRequest: HttpRequest): Promise<HttpResponse<Model>> {
        const pokemons = await this.pokemonRepository.listAll();
        return ok(pokemons);
    }
}

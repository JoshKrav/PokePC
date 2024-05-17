import postgres from "postgres";
import { StatusCode } from "../src/router/Response";
import { HttpResponse, clearCookieJar, makeHttpRequest } from "./client";
import { test, describe, expect, afterEach, beforeEach,afterAll } from "vitest";
import User,{UserProps} from "../src/models/User"
import Pokemon,{PokemonProps} from "../src/models/Pokemon"
describe("HTTP operations", () => {
	const sql = postgres({
		database: "MyDB",
	});

	beforeEach(async () => {
		await createUser()
	});

	/**
	 * Clean up the database after each test. This function deletes all the rows
	 * from the todos and subtodos tables and resets the sequence for each table.
	 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
	 */
	afterEach(async () => {
		// Replace the table_name with the name of the table(s) you want to clean up.
		const tables = ["team_positions","pokemon_moves","box_species","box","team","users"];

		try {
			for (const table of tables) {
				await sql.unsafe(`DELETE FROM ${table}`);
				await sql.unsafe(
					`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`,
				);
			}
		} catch (error) {
			console.error(error);
		}

		await makeHttpRequest("POST", "/logout");
		clearCookieJar();
	});
	const createUser = async () => {
		return await User.create(sql, {
			email: "user@email.com",
			password:"password",
		});
	};
	const login = async (
		email: string = "user@email.com",
		password: string = "password",
	) => {
		await makeHttpRequest("POST", "/login", {
			email,
			password,
		});
	};

	test("Homepage was retrieved successfully.", async () => {
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			"/",
		);

		expect(statusCode).toBe(StatusCode.OK);
		expect(Object.keys(body).includes("message")).toBe(true);
		expect(Object.keys(body).includes("payload")).toBe(true);
		expect(body.message).toBe("Homepage!");
	});

	test("Invalid path returned error.", async () => {
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			"/foo",
		);

		expect(statusCode).toBe(StatusCode.NotFound);
		expect(Object.keys(body).includes("message")).toBe(true);
		expect(Object.keys(body).includes("payload")).toBe(false);
		expect(body.message).toBe("Invalid route: GET /foo");
	});
	test("Pokemon was created", async () => {
		await login();
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"POST",
			"/box/:boxid/pokemon/:pokemonId/",
			{
				pokemonId:1,
				userId:1,
				boxId:1,
				level:2,
				nature:"nature",
				ability:"ability",
			}
		);

		expect(statusCode).toBe(StatusCode.Created);
		expect(Object.keys(body).includes("message")).toBe(true);
		expect(Object.keys(body).includes("payload")).toBe(false);
		expect(body.message).toBe("Pokemon Created!");
		expect(Object.keys(body.payload.pokemon).includes("id")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("userId")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("boxId")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("level")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("nature")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("ability")).toBe(true);
		expect(body.payload.pokemon.id).toBe(1);
		expect(body.payload.pokemon.userId).toBe(1);
		expect(body.payload.pokemon.boxId).toBe(1);
		expect(body.payload.pokemon.level).toBe(2);
		expect(body.payload.pokemon.nature).toBe("nature")
		expect(body.payload.pokemon.ability).toBe("ability");
	});
	
	test("Pokemon was updated.", async () => {
		await login();

		let moves:number[] = [1,2,3,4]
		let pokemon = await Pokemon.create(sql,{
			pokemonId:1,
				userId:1,
				boxId:1,
				level:2,
				nature:"nature",
				ability:"ability",
		},moves)
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"PUT",
			`/box/${pokemon.props.boxId}/pokemon/${pokemon.props.id}/`,
			{
				level:3,
			}
		);

		expect(statusCode).toBe(StatusCode.OK);
		expect(Object.keys(body).includes("message")).toBe(true);
		expect(Object.keys(body).includes("payload")).toBe(false);
		expect(body.message).toBe("Pokemon Updated!");
		expect(Object.keys(body.payload.pokemon).includes("id")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("userId")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("boxId")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("level")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("nature")).toBe(true);
		expect(Object.keys(body.payload.pokemon).includes("ability")).toBe(true);
		expect(body.payload.pokemon.level).toBe(3);
	});
	test("Box Pokemon was retrieved.", async () => {
		await login();

		let moves:number[] = [1,2,3,4]
		let pokemon = await Pokemon.create(sql,{
			pokemonId:1,
				userId:1,
				boxId:1,
				level:2,
				nature:"nature",
				ability:"ability",
		},moves)
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			`/box/${pokemon.props.boxId}/pokemon/${pokemon.props.id}/`,
		);

		expect(statusCode).toBe(StatusCode.OK);
		expect(body.message).toBe(`Retrieved Pokémon details for box ${pokemon.props.boxId}, Pokémon ${pokemon.props.pokemonId}`);
		expect(body.payload.pokemon.id).toBe(pokemon.props.id);
		expect(body.payload.pokemon.userId).toBe(pokemon.props.userId);
		expect(body.payload.pokemon.boxId).toBe(pokemon.props.boxId);
		expect(body.payload.pokemon.level).toBe(pokemon.props.level);
		expect(body.payload.pokemon.nature).toBe(pokemon.props.nature);
		expect(body.payload.pokemon.ability).toBe(pokemon.props.ability);
	});

	test("Pokemon was deleted.", async () => {
		await login();

		let moves:number[] = [1,2,3,4]
		let pokemon = await Pokemon.create(sql,{
			pokemonId:1,
				userId:1,
				boxId:1,
				level:2,
				nature:"nature",
				ability:"ability",
		},moves)
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"DELETE",
			`/box/${pokemon.props.boxId}/pokemon/${pokemon.props.id}/`,
		);

		expect(statusCode).toBe(StatusCode.OK);
		expect(body.message).toBe("Pokemon Deleted!");
	});
	test("Pokemon not added due to unauthenticated user.", async () => {

		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"POST",
			"/box/:boxid/pokemon/:pokemonId/",
			{
				pokemonId:1,
				userId:1,
				boxId:1,
				level:2,
				nature:"nature",
				ability:"ability",
			},
		);

		expect(statusCode).toBe(StatusCode.Unauthorized);
		expect(body.message).toBe("Unauthorized");
	});
	test("Pokemon not updated due to unauthenticated user.", async () => {
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"PUT",
			"/box/:boxid/pokemon/update/:pokemonId",
			{
				pokemonId:1,
				userId:1,
				boxId:1,
				level:2,
				nature:"nature",
				ability:"ability",
			},
		);

		expect(statusCode).toBe(StatusCode.Unauthorized);
		expect(body.message).toBe("Unauthorized");
	});
	test("Pokemon not deleted due to unauthenticated user.", async () => {
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"DELETE",
			"/box/:boxId/pokemon/:pokemonId",
		);

		expect(statusCode).toBe(StatusCode.Unauthorized);
		expect(body.message).toBe("Unauthorized");
	});
	test("Pokemon not retrieved due to unauthenticated user.", async () => {

		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			"/box/:boxId/pokemon/:pokemonId",
		);

		expect(statusCode).toBe(StatusCode.Unauthorized);
		expect(body.message).toBe("Unauthorized");
	});
	test("Box Pokemon not retrieved due to unauthenticated user.", async () => {

		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			"/box/:boxId/pokemon",
		);

		expect(statusCode).toBe(StatusCode.Unauthorized);
		expect(body.message).toBe("Unauthorized");
	});
	
});

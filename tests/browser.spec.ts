import postgres from "postgres";
import { test, expect, Page } from "@playwright/test";
import { getPath } from "../src/url";
import Pokemon,{PokemonProps} from "../src/models/Pokemon"
import Move,{PokemonSpecies} from "../src/models/Database"
import User,{UserProps} from "../src/models/User"
const sql = postgres({
	database: "MyDB",
});

const logout = async (page: Page) => {
	await page.goto("/logout");
};

test.beforeEach(async () => {
	// Anything you want to do before each test runs?
});

/**
 * Clean up the database after each test. This function deletes all the rows
 * from the todos and subtodos tables and resets the sequence for each table.
 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
 */
test.afterEach(async ({ page }) => {
	// Replace the table_name with the name of the table(s) you want to clean up.
	const tables = ["users"];

	try {
		for (const table of tables) {
			await sql.unsafe(`DELETE FROM ${table}`);
			await sql.unsafe(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`);
		}
	} catch (error) {
		console.error(error);
	}

	await logout(page);
});

const createPokemon = async (props:PokemonProps) => {

	
	let moves:Move[] = await Move.readAll(sql)
	let movelist:Move[] = []
	for(let i =0;i<4;i++){
		movelist[i] = moves[i]
	}
	return await Pokemon.create(sql, props, movelist);
};

const createUser = async (props: Partial<UserProps> = {}) => {
	return await User.create(sql, {
		email: props.email || "user@email.com",
		password: props.password || "password",
		// isAdmin: props.isAdmin || false, // Uncomment if implementing admin feature.
	});
};

test("Homepage was retrieved successfully", async ({ page }) => {
	await page.goto("/");

	expect(await page?.title()).toBe("PokePC");
});

const login = async (
	page: Page,
	email: string = "user@email.com",
	password: string = "password",
) => {
	await page.goto(`/login`);
	await page.fill('form#login-form input[name="email"]', email);
	await page.fill('form#login-form input[name="password"]', password);
	await page.click("form#login-form #login-form-submit-button");
};
test.beforeEach(async () => {
	await createUser();
});


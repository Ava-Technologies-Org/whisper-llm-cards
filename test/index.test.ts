/// <reference path="../types.d.ts" />
import test from "ava";
import {
	whisperLLMCardsJson,
	getLatestConfig,
	processSystemMessage,
	templateVariables,
	type Message,
	type WhisperLLMCard,
} from "../src";

// Tests for whisperLLMCardsJson export
test("whisperLLMCardsJson has correct structure", (t) => {
	t.truthy(whisperLLMCardsJson);
	t.is(typeof whisperLLMCardsJson, "object");
	t.truthy(whisperLLMCardsJson.version);
	t.truthy(whisperLLMCardsJson.recommendedCard);
	t.truthy(whisperLLMCardsJson.cards);
});

test("whisperLLMCardsJson version is a string", (t) => {
	t.is(typeof whisperLLMCardsJson.version, "string");
});

test("whisperLLMCardsJson recommendedCard exists in cards", (t) => {
	const { recommendedCard, cards } = whisperLLMCardsJson;
	t.truthy(cards[recommendedCard]);
});

test("whisperLLMCardsJson cards is an object", (t) => {
	t.is(typeof whisperLLMCardsJson.cards, "object");
	t.true(Object.keys(whisperLLMCardsJson.cards).length > 0);
});

test("whisperLLMCardsJson recommended card has correct properties", (t) => {
	const { recommendedCard, cards } = whisperLLMCardsJson;
	const card = cards[recommendedCard];

	t.truthy(card);
	t.is(typeof card.name, "string");
	t.is(card.type, "gguf");
	t.is(typeof card.sourceUrl, "string");
	t.is(typeof card.sizeGB, "number");
	t.is(typeof card.parametersB, "number");
	t.is(typeof card.ramGB, "number");
});

test("whisperLLMCardsJson all cards have valid structure", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const [key, card] of Object.entries(cards) as [
		string,
		WhisperLLMCard,
	][]) {
		t.is(typeof key, "string");
		t.is(typeof card.name, "string");
		t.is(card.type, "gguf");
		t.is(typeof card.sourceUrl, "string");
		t.true(card.sourceUrl.startsWith("http"));
		t.is(typeof card.sizeGB, "number");
		t.true(card.sizeGB > 0);
		t.is(typeof card.parametersB, "number");
		t.true(card.parametersB > 0);
		t.is(typeof card.ramGB, "number");
		t.true(card.ramGB > 0);
	}
});

test("whisperLLMCardsJson card values are within reasonable ranges", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const card of Object.values(cards) as WhisperLLMCard[]) {
		// Size should be between 0.1GB and 1000GB
		t.true(card.sizeGB >= 0.1 && card.sizeGB <= 1000);
		// Parameters should be between 0.1B and 1000B
		t.true(card.parametersB >= 0.1 && card.parametersB <= 1000);
		// RAM should be between 0.1GB and 10000GB
		t.true(card.ramGB >= 0.1 && card.ramGB <= 10000);
	}
});

// Tests for getLatestConfig function
test("getLatestConfig returns a promise", (t) => {
	// Mock fetch to avoid actual network call
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url: string | URL | Request) => {
		const urlString = url.toString();

		// Mock versions.json
		if (urlString.includes("versions.json")) {
			return {
				ok: true,
				json: async () => ({
					latest: "1.0.0",
					channels: { "1": "1.0.0", "1.0": "1.0.0" },
				}),
			} as Response;
		}

		// Mock cards.json
		return {
			ok: true,
			json: async () => ({ version: "1.0.0", recommendedCard: "test", cards: {} }),
		} as Response;
	};

	const result = getLatestConfig();
	t.true(result instanceof Promise);

	// Restore original fetch
	globalThis.fetch = originalFetch;
});

// Skip network tests by default - enable with: ava --match '*network*'
test("getLatestConfig fetches and returns valid config (network)", async (t) => {
	// Use main branch URL for testing since tags won't exist until after release
	const config = await getLatestConfig(
		"https://avatechnologies.org/whisper-llm-cards/refs/heads/main/cards.json",
	);

	t.truthy(config);
	t.is(typeof config, "object");
	t.truthy(config.version);
	t.is(typeof config.version, "string");
	t.truthy(config.recommendedCard);
	t.is(typeof config.recommendedCard, "string");
	t.truthy(config.cards);
	t.is(typeof config.cards, "object");
});

test("getLatestConfig returns cards with valid structure (network)", async (t) => {
	// Use main branch URL for testing since tags won't exist until after release
	const config = await getLatestConfig(
		"https://avatechnologies.org/whisper-llm-cards/refs/heads/main/cards.json",
	);

	t.true(Object.keys(config.cards).length > 0);

	for (const [key, card] of Object.entries(config.cards) as [
		string,
		WhisperLLMCard,
	][]) {
		t.is(typeof key, "string");
		t.is(typeof card.name, "string");
		t.is(card.type, "gguf");
		t.is(typeof card.sourceUrl, "string");
		t.true(card.sourceUrl.startsWith("http"));
		t.is(typeof card.sizeGB, "number");
		t.is(typeof card.parametersB, "number");
		t.is(typeof card.ramGB, "number");
	}
});

test("getLatestConfig recommendedCard exists in returned cards (network)", async (t) => {
	// Use main branch URL for testing since tags won't exist until after release
	const config = await getLatestConfig(
		"https://avatechnologies.org/whisper-llm-cards/refs/heads/main/cards.json",
	);

	t.truthy(config.cards[config.recommendedCard]);
});

test("getLatestConfig handles network errors gracefully", async (t) => {
	// Mock fetch to simulate network error for cards.json
	// Pass explicit URL to bypass versions.json lookup
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => {
		return {
			ok: false,
			status: 404,
			statusText: "Not Found",
		} as Response;
	};

	const error = await t.throwsAsync(async () => {
		await getLatestConfig("https://example.com/cards.json");
	});

	t.truthy(error);
	t.true(error?.message.includes("Failed to fetch config"));

	// Restore original fetch
	globalThis.fetch = originalFetch;
});

test("getLatestConfig uses first model as recommendedCard if not specified", async (t) => {
	// Mock fetch to return data without recommendedCard
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url: string | URL | Request) => {
		const urlString = url.toString();

		// Mock versions.json
		if (urlString.includes("versions.json")) {
			return {
				ok: true,
				json: async () => ({
					latest: "1.0.0",
					channels: {
						"1": "1.0.0",
						"1.0": "1.0.0",
					},
				}),
			} as Response;
		}

		// Mock cards.json without recommendedCard
		return {
			ok: true,
			json: async () => ({
				version: "1.0.0",
				cards: {
					"model-1": {
						name: "Model 1",
						type: "gguf",
						sourceUrl: "https://example.com/model1.gguf",
						sizeGB: 1.0,
						parametersB: 1,
						ramGB: 2.0,
					},
					"model-2": {
						name: "Model 2",
						type: "gguf",
						sourceUrl: "https://example.com/model2.gguf",
						sizeGB: 2.0,
						parametersB: 2,
						ramGB: 4.0,
					},
				},
			}),
		} as Response;
	};

	const config = await getLatestConfig();

	t.is(config.recommendedCard, "model-1");
	t.truthy(config.cards["model-1"]);

	// Restore original fetch
	globalThis.fetch = originalFetch;
});

// Tests for processSystemMessage function
test("processSystemMessage replaces date_time_string template variable", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "Today's date is {date_time_string}.",
			defaultTemplateValues: {
				date_time_string: templateVariables.date_time_string.defaultValue,
			},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	// Should contain a date/time string (not the placeholder or default)
	t.false(result.includes("{date_time_string}"));
	t.true(result.startsWith("Today's date is "));
	const minExpectedLength = `Today's date is ${templateVariables.date_time_string.defaultValue}.`.length;
	t.true(result.length > minExpectedLength);
	t.is(typeof result, "string");
});

test("processSystemMessage handles template with no variables", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "You are a helpful assistant.",
			defaultTemplateValues: {},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	t.is(result, "You are a helpful assistant.");
});

test("processSystemMessage replaces multiple occurrences of same variable", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "Date: {date_time_string}. I repeat: {date_time_string}",
			defaultTemplateValues: {
				date_time_string: templateVariables.date_time_string.defaultValue,
			},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	// Should not contain any placeholder braces
	t.false(result.includes("{date_time_string}"));
	t.true(result.startsWith("Date: "));
	// Both occurrences should be replaced
	const parts = result.split("I repeat: ");
	t.is(parts.length, 2);
	t.true(parts[1].length > 0);
});

test("processSystemMessage uses card default for unknown variables", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "Model: {model_name}, Version: {version}",
			defaultTemplateValues: {
				model_name: "TestModel",
				version: "1.0",
			},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	t.is(result, "Model: TestModel, Version: 1.0");
});

test("processSystemMessage preserves unknown variables without defaults", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "Hello {unknown_variable}!",
			defaultTemplateValues: {},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	// Unknown variable without default should remain as-is
	t.is(result, "Hello {unknown_variable}!");
});

test("processSystemMessage handles empty template", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "",
			defaultTemplateValues: {},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	t.is(result, "");
});

test("processSystemMessage handles mix of known and unknown variables", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template:
				"Date: {date_time_string}, Custom: {custom_var}, Unknown: {unknown}",
			defaultTemplateValues: {
				custom_var: "my_value",
			},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	// date_time_string should be resolved
	t.false(result.includes("{date_time_string}"));
	// custom_var should use card default
	t.true(result.includes("Custom: my_value"));
	// unknown should remain as-is
	t.true(result.includes("Unknown: {unknown}"));
});

test("processSystemMessage accepts Message array parameter", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "System message",
			defaultTemplateValues: {},
		},
	};

	// Test with various message types
	const messages: Message[] = [
		{ role: "system", content: "System prompt" },
		{ role: "user", content: "User message" },
		{ role: "assistant", content: "Assistant response" },
	];

	const result = processSystemMessage(mockCard, messages);

	// Should process successfully regardless of messages content
	t.is(result, "System message");
	t.is(typeof result, "string");
});

test("processSystemMessage works with actual whisperLLMCardsJson data", (t) => {
	const { cards, recommendedCard } = whisperLLMCardsJson;
	const card = cards[recommendedCard];
	const messages: Message[] = [];

	const result = processSystemMessage(card, messages);

	// Should process the actual template
	t.true(result.includes("Whisper"));
	t.false(result.includes("{date_time_string}"));
	t.true(result.length > 0);
	t.is(typeof result, "string");
});

// Tests for systemMessage structure in cards
test("whisperLLMCardsJson all cards have systemMessage property", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const [key, card] of Object.entries(cards) as [
		string,
		WhisperLLMCard,
	][]) {
		t.truthy(card.systemMessage, `Card ${key} should have systemMessage`);
		t.is(
			typeof card.systemMessage,
			"object",
			`Card ${key} systemMessage should be an object`,
		);
	}
});

test("whisperLLMCardsJson all cards have valid systemMessage structure", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const [key, card] of Object.entries(cards) as [
		string,
		WhisperLLMCard,
	][]) {
		// Check template property
		t.truthy(
			card.systemMessage.template,
			`Card ${key} should have systemMessage.template`,
		);
		t.is(
			typeof card.systemMessage.template,
			"string",
			`Card ${key} systemMessage.template should be a string`,
		);

		// Check defaultTemplateValues property
		t.truthy(
			card.systemMessage.defaultTemplateValues,
			`Card ${key} should have systemMessage.defaultTemplateValues`,
		);
		t.is(
			typeof card.systemMessage.defaultTemplateValues,
			"object",
			`Card ${key} systemMessage.defaultTemplateValues should be an object`,
		);
	}
});

test("whisperLLMCardsJson all cards have date_time_string in defaultTemplateValues", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const [key, card] of Object.entries(cards) as [
		string,
		WhisperLLMCard,
	][]) {
		// Since template uses {date_time_string}, card should have a default for it
		if (card.systemMessage.template.includes("{date_time_string}")) {
			t.truthy(
				card.systemMessage.defaultTemplateValues.date_time_string,
				`Card ${key} uses {date_time_string} so should have a default value`,
			);
			t.is(
				typeof card.systemMessage.defaultTemplateValues.date_time_string,
				"string",
				`Card ${key} date_time_string default should be a string`,
			);
		}
	}
});

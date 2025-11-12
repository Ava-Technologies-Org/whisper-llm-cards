/// <reference path="../types.d.ts" />
import test from "ava";
import {
	whisperLLMCardsJson,
	type WhisperLLMCard,
} from "../src";

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

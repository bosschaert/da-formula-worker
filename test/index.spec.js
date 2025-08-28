/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// import { describe, it, expect } from 'vitest';
import assert from 'assert';
import { sort } from '../src/index.js';

describe('Sheets Worker', () => {
	it('sorts json sheets', () => {
		const json = {
			"data": [
				{ "name": "Fred", "age": "010" },
				{ "name": "Wilma", "age": "8" },
				{ "name": "Barney", "age": "30" },
				{ "name": "Betty", "age": "28" }
			]
		};
		const sorted = sort('name', false, json);
		assert.equal(sorted.data[0].name, 'Barney');
		assert.equal(sorted.data[1].name, 'Betty');
		assert.equal(sorted.data[2].name, 'Fred');
		assert.equal(sorted.data[3].name, 'Wilma');

		const sorted2 = sort('age', true, json);
		assert.equal(sorted2.data[0].name, 'Wilma');
		assert.equal(sorted2.data[1].name, 'Fred');
		assert.equal(sorted2.data[2].name, 'Betty');
		assert.equal(sorted2.data[3].name, 'Barney');
	});

	// it('')
});

// describe('Hello World worker', () => {
// 	it('responds with Hello World! (unit style)', async () => {
// 		const request = new Request('http://example.com');
// 		// Create an empty context to pass to `worker.fetch()`.
// 		const ctx = createExecutionContext();
// 		const response = await worker.fetch(request, env, ctx);
// 		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
// 		await waitOnExecutionContext(ctx);
// 		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
// 	});

// 	it('responds with Hello World! (integration style)', async () => {
// 		const response = await SELF.fetch('http://example.com');
// 		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
// 	});
// });

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

import assert from 'assert';
import { dropObjects, sort } from '../src/index.js';

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

	function getTestSheet() {
		return {
			"columns": [
				"path",
				"title",
				"price",
				"category"
			],
			"data": [
				{
					"title": "My Doc 2",
					"category": "cat1",
					"price": "",
					"path": "/news/doc2"
				},
				{
					"title": "Doc 4",
					"category": "Food",
					"price": "1",
					"path": "/filtering/doc4"
				},
				{
					"path": "/blah",
					"title": "Pretty much an empty doc with some tags",
					"price": "",
					"category": "cat1"
				},
				{
					"path": "/news/doc1",
					"title": "This is the title",
					"price": "",
					"category": "cat1"
				}
			],
			"offset": 0,
			"limit": 4,
			"total": 4,
			":type": "sheet"
		};
	}

	it('filters fields', () => {
		let json = getTestSheet();
		json = dropObjects(json, [{ category: "Food" }]);
		assert.equal(json.data.length, 3);
		assert.equal(json.offset, 0);
		assert.equal(json.limit, 3);
		assert.equal(json.total, 3);
		assert.equal(json[':type'], 'sheet');
	});

	it('filters multi fields', () => {
		let json = getTestSheet();
		json = dropObjects(json, [{ category: "cat1", title: "My Doc 2" }, { price: "1"}]);
		assert.equal(json.data.length, 2);
		assert.equal(json.offset, 0);
		assert.equal(json.limit, 2);
		assert.equal(json.total, 2);
		assert.equal(json[':type'], 'sheet');

		// check the paths
		const paths = new Set();
		json.data.forEach(row => paths.add(row.path));
		assert(paths.has('/blah'));
		assert(paths.has('/news/doc1'));
	});
});
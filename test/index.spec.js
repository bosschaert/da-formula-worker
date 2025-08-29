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
import { dropObjects, getHeaders, keepObjects, sort, validateJson } from '../src/index.js';
import worker from '../src/index.js';

describe('Sheets Worker', () => {
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

	function getTestSheet2() {
		return {
			"data": [
				{ "name": "Fred", "age": "010" },
				{ "name": "Wilma", "age": "8" },
				{ "name": "Barney", "age": "30" },
				{ "name": "Dory", "age": "100" },
				{ "name": "Betty", "age": "28" },
			],
			"offset": 0,
			"limit": 5,
			"total": 5,
			":type": "sheet"
		};
	}

	it('sorts json sheets', () => {
		const json = getTestSheet2();
		const sorted = sort('name', false, json);
		assert.equal(sorted.data[0].name, 'Barney');
		assert.equal(sorted.data[1].name, 'Betty');
		assert.equal(sorted.data[2].name, 'Dory');
		assert.equal(sorted.data[3].name, 'Fred');
		assert.equal(sorted.data[4].name, 'Wilma');

		const sorted2 = sort('age', true, json);
		assert.equal(sorted2.data[0].name, 'Wilma');
		assert.equal(sorted2.data[1].name, 'Fred');
		assert.equal(sorted2.data[2].name, 'Betty');
		assert.equal(sorted2.data[3].name, 'Barney');
		assert.equal(sorted2.data[4].name, 'Dory');
	});

	it('keep objects', () => {
		let json = getTestSheet();
		json = keepObjects(json, [{ category: "cat1" }]);
		assert.equal(json.data.length, 3);
		assert.equal(json.offset, 0);
		assert.equal(json.limit, 3);
		assert.equal(json.total, 3);
		assert.equal(json[':type'], 'sheet');

		// check the paths
		const paths = new Set();
		json.data.forEach(row => paths.add(row.path));
		assert(paths.has('/blah'));
		assert(paths.has('/news/doc1'));
		assert(paths.has('/news/doc2'));

		// Check all properties of one object
		json.data.forEach(r => {
			if (r.path === '/news/doc2') {
				assert.equal(r.title, 'My Doc 2');
				assert.equal(r.category, 'cat1');
				assert.equal(r.price, '');
			}
		});
	});

	it('keep object multi fields', () => {
		let json = getTestSheet();
		json = keepObjects(json, [{ category: "cat1", path: "/blah" }, { category: "Food"}]);
		assert.equal(json.data.length, 2);
		assert.equal(json.offset, 0);
		assert.equal(json.limit, 2);
		assert.equal(json.total, 2);

		const foodIdx = json.data.findIndex(r => r.category === 'Food');
		json.data[foodIdx].title = 'Doc 4';
		json.data[foodIdx].path = '/filtering/doc4';
		json.data[foodIdx].price = '1';
		json.data[foodIdx].category = 'Food';

		const blahIdx = json.data.findIndex(r => r.path === '/blah');
		assert(blahIdx, 1 - foodIdx);
		json.data[blahIdx].title = 'Pretty much an empty doc with some tags';
		json.data[blahIdx].price = '';
		json.data[blahIdx].category = 'cat1';
	});

	it('drops objects', () => {
		let json = getTestSheet();
		json = dropObjects(json, [{ category: "Food" }]);
		assert.equal(json.data.length, 3);
		assert.equal(json.offset, 0);
		assert.equal(json.limit, 3);
		assert.equal(json.total, 3);
		assert.equal(json[':type'], 'sheet');
	});

	it('drops objects multi fields', () => {
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

	it('copies headers', () => {
		const reqHeaders = new Headers();
		reqHeaders.set('Content-Type', 'application/json');
		reqHeaders.set('Access-Control-Allow-Origin', '*');
		reqHeaders.set('Cache-Control', 'no-cache');
		reqHeaders.set('Last-Modified', 'Wed, 21 Oct 2015 07:28:00 GMT');
		reqHeaders.set('Foobar', 'blahblahblah');

		const headers = getHeaders(reqHeaders);
		assert.equal(headers.get('Content-Type'), 'application/json');
		assert.equal(headers.get('Access-Control-Allow-Origin'), '*');
		assert.equal(headers.get('Cache-Control'), 'no-cache');
		assert.equal(headers.get('Last-Modified'), 'Wed, 21 Oct 2015 07:28:00 GMT');
		assert(headers.get('Strict-Transport-Security') === null);
		assert(headers.get('Foobar') === null);
	})

	it('validates', () => {
		const json1 = {
			offset: 0,
			limit: 42,
			total: 42,
		}
		validateJson(json1);

		const json2 = {
			offset: 5,
			limit: 42,
			total: 42,
		}
		assert.throws(() => validateJson(json2));

		const json3 = {
			offset: 0,
			limit: 42,
			total: 99,
		}
		assert.throws(() => validateJson(json3));
	});

	it('fetch operation', async () => {
		const mockFetch = (url) => {
			if (url === 'https://branch--proj--org.aem.page/path/idx.json') {
				return new Response(JSON.stringify(getTestSheet()));
			}
		};
		const savedFetch = globalThis.fetch;

		try {
			globalThis.fetch = mockFetch;

			const url = encodeURI('https://example.com/org/proj/branch/path/idx.json?query={"sort":"path","keep":[{"category":"cat1"}],"drop":[{"path":"/blah"}]}');
			const req = new Request(url);
			const response = await worker.fetch(req);
			assert.equal(response.status, 200);
			const json = await response.json();
			assert.equal(json.data.length, 2);
			assert.equal(json.offset, 0);
			assert.equal(json.limit, 2);
			assert.equal(json.total, 2);
			assert.equal(json[':type'], 'sheet');

			assert.equal(json.data[0].path, '/news/doc1');
			assert.equal(json.data[1].path, '/news/doc2');

		} finally {
			globalThis.fetch = savedFetch;
		}
	});

	it('fetch operation numeric sort', async () => {
		const mockFetch = (url) => {
			if (url === 'https://branch--proj--org.aem.page/abc.json') {
				return new Response(JSON.stringify(getTestSheet2()));
			}
		};
		const savedFetch = globalThis.fetch;

		try {
			globalThis.fetch = mockFetch;

			const url = encodeURI('https://example.com/org/proj/branch/abc.json?query={"sort":"age","num-sort":"true"}');
			const req = new Request(url);
			const resp = await worker.fetch(req);
			assert.equal(resp.status, 200);
			const json = await resp.json();
			assert.equal(json.data.length, 5);
			assert.equal(json.offset, 0);
			assert.equal(json.limit, 5);
			assert.equal(json.total, 5);
			assert.equal(json[':type'], 'sheet');

			const ages = json.data.map((r) => r.age);
			assert.deepStrictEqual(ages, ['8', '010', '28', '30', '100']);
		} finally {
			globalThis.fetch = savedFetch;
		}
	})

	it('fetch operation string sort', async () => {
		const mockFetch = (url) => {
			if (url === 'https://branch--proj--org.aem.page/abc.json') {
				return new Response(JSON.stringify(getTestSheet2()));
			}
		};
		const savedFetch = globalThis.fetch;

		try {
			globalThis.fetch = mockFetch;

			const url = encodeURI('https://example.com/org/proj/branch/abc.json?query={"sort":"age","num-sort":"false"}');
			const req = new Request(url);
			const resp = await worker.fetch(req);
			assert.equal(resp.status, 200);
			const json = await resp.json();
			assert.equal(json.data.length, 5);
			assert.equal(json.offset, 0);
			assert.equal(json.limit, 5);
			assert.equal(json.total, 5);
			assert.equal(json[':type'], 'sheet');

			const ages = json.data.map((r) => r.age);
			assert.deepStrictEqual(ages, ['010', '100', '28', '30', '8']);
		} finally {
			globalThis.fetch = savedFetch;
		}
	})
});


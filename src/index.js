
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

export function sort(field, numSort, json) {
	console.log('Sorting on', field, '- numsort', numSort);
	const data = json.data;
	if (numSort) {
		data.sort((a, b) => Number(a[field]) - Number(b[field]));
	} else {
		data.sort((a, b) => a[field].localeCompare(b[field]));
	}
	return json;
};

export function dropObjects(json, dropSpec) {
	console.log('Dropping', dropSpec)
	const data = json.data;
	for (let i = data.length - 1; i >= 0; i--) {
		const obj = data[i];

		for (const fields of dropSpec) {
			let match = true;
			for (const key of Object.keys(fields)) {
				const val = fields[key];
				if (obj[key] !== val) {
					match = false;
				}
			}
			if (match) {
				// All dropped fields match, remove the object
				data.splice(i, 1);
			}
		}
	}

	json.limit = data.length;
	json.total = data.length;

	return json;
}

export function keepObjects(json, keepSpec) {
	console.log('Keeping', keepSpec)
	const data = json.data;
	for (let i = data.length - 1; i >= 0; i--) {
		const obj = data[i];

		let toKeep = false;
		for (const fields of keepSpec) {
			let match = true;
			for (const key of Object.keys(fields)) {
				const val = fields[key];
				if (obj[key] !== val) {
					match = false;
				}
			}
			if (match) {
				toKeep = true;
			}
		}
		if (!toKeep) {
			data.splice(i, 1);
		}
	}

	json.limit = data.length;
	json.total = data.length;

	return json;
}

export function validateJson(json) {
	if(json.offset != 0) {
		const e = new Error('Only offset=0 is supported');
		e.code = 412;
		throw e;
	}
	if (json.limit != json.total) {
		const e = new Error(`Pagination is not supported, limit=${json.limit}, total=${json.total}`);
		e.code = 412;
		throw e;
	}
}

function copyHeader(name, inh, out) {
	const v = inh.get(name);
	if (v) {
		out.set(name, v);
	}
}

export function getHeaders(inhdr) {
	console.log(inhdr);
	const headers = new Headers();
	copyHeader('Content-Type', inhdr, headers);
	copyHeader('Access-Control-Allow-Origin', inhdr, headers);
	copyHeader('Cache-Control', inhdr, headers);
	copyHeader('Last-Modified', inhdr, headers);
	copyHeader('Strict-Transport-Security', inhdr, headers);
	return headers;
}

export default {
	async fetch(request, env, ctx) {
		try {
			console.log('Request received', request.url);
			const url = new URL(request.url);

			const parts = url.pathname.split('/');
			const filtered = parts.filter(n => n)
			console.log('URL parts:', filtered);

			if (filtered.length < 4) {
				return new Response('Invalid request, should be /org/site/branch?query={<json query>}', { status: 400 });
			}

			const org = filtered.shift();
			const site = filtered.shift();
			const branch = filtered.shift();
			const path = filtered.join('/');

			const reqUrl = `https://${branch}--${site}--${org}.aem.page/${path}`;
			console.log('Request URL:', reqUrl);

			const doc = await fetch(reqUrl);

			let json = await doc.json();
			console.log('Query', url.searchParams);
			const queryString = url.searchParams.get('query');
			if (!queryString) {
				return new Response(JSON.stringify(json));
			}

			validateJson(json);

			console.log('Querystring', queryString);
			const query = JSON.parse(queryString);

			const keep = query['keep'];
			if (keep) {
				json = keepObjects(json, keep);
			}

			const drop = query['drop'];
			if (drop) {
				json = dropObjects(json, drop);
			}

			const sortkey = query['sort'];
			if (sortkey) {
				const numSort = query['num-sort'] === 'true';
				json = sort(sortkey, numSort, json);
			}

			const headers = getHeaders(doc.headers);

			return new Response(JSON.stringify(json), { headers });
		} catch (e) {
			const code = e.code || 500;
			console.error('Error occurred:', e);
			return new Response(JSON.stringify({ error: e.message }), { status: e.code || 500 });
		}
	},
};

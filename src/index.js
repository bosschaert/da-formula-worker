
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


export default {
	async fetch(request, env, ctx) {
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
		// console.log('Obtained: ', json);
		console.log('Query', url.searchParams);
		const queryString = url.searchParams.get('query');
		if (!queryString) {
			return new Response(JSON.stringify(json));
		}

		console.log('Querystring', queryString);
		const query = JSON.parse(queryString);
		const sortkey = query['sort'];
		if (sortkey) {
			const numSort = query['num-sort'] === 'true';
			json = sort(sortkey, numSort, json);
		}

		return new Response(JSON.stringify(json));
	},
};

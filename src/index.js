/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

function sort(field, json) {
	console.log('Sorting on', field);
	const data = json.data;
	data.sort((a, b) => a[field].localeCompare(b[field]));
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
		console.log('Obtained: ', json);
		console.log('Query', url.searchParams);
		const queryString = url.searchParams.get('query');
		if (!queryString) {
			return new Response(JSON.stringify(json));
		}

		console.log('Querystring', queryString);
		const query = JSON.parse(queryString);
		const sortkey = query['sort'];
		if (sortkey) {
			json = sort(sortkey, json);
		}

		return new Response(JSON.stringify(json));
	},
};

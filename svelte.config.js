import preprocess from 'svelte-preprocess';
// import adapter from '@sveltejs/adapter-static';
import adapter_ipfs from 'sveltejs-adapter-ipfs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		// adapter: adapter({
		// 	// fallback: '200.html'
		// }),

		adapter: adapter_ipfs({removeBuiltInServiceWorkerRegistration: true, injectPagesInServiceWorker: true}),

		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',

		ssr: false
	}
};

export default config;

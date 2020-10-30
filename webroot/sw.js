const CACHE_NAME = "sw:i:2"

self.addEventListener('activate', async e => {
	e.waitUntil((async () => {
		const keys = await caches.keys();
		keys.forEach(async i => {
			if (i.startsWith("sw:") && i !== CACHE_NAME)
				await caches.delete(i);
		});
	})());
});

self.addEventListener('fetch', async e => {
	e.respondWith((async () => {
		const url = new URL(e.request.url);
		let nohint = true;
		let uquery = false;

		if (URL.prototype.hasOwnProperty("searchParams")) {
			hc = url.searchParams.get("hc");
			if (hc != null) {
				nohint = false;
				switch (hc) {
				case "uquery":
					uquery = true;
					break;
				}
			}
		}

		if (nohint &&
		    !url.pathname.startsWith("/assets/") &&
		    !url.pathname.startsWith("/styles/") &&
		    !url.pathname.startsWith("/webfonts/"))
			return fetch(e.request.clone());

		const cache = await caches.open(CACHE_NAME);
		let resp = await cache.match(e.request);
		if (!resp) {
			if (uquery) {
				cache.matchAll(e.request, {
					"ignoreSearch": true
				}).then(resp => {
					resp.forEach((el, index, arr) => {
						console.log('sw: deleting the response to', el.url);
						cache.delete(el.url);
					});
				});
			}
			resp = await fetch(e.request.clone());
			if (resp.status < 400) {
				console.log('sw: caching the response to', e.request.url);
				await cache.put(e.request, resp.clone());
			}
		}
		return resp;
	})());
});

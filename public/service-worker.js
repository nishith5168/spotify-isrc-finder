const CACHE_NAME =
    "spotify-isrc-finder-v2";


const APP_FILES = [
    "/",
    "/index.html",
    "/styles.css",
    "/script.js",
    "/manifest.json",
    "/icon-192.svg",
    "/icon-512.svg"
];



/* =========================================
   INSTALL
========================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(
                    CACHE_NAME
                )
                .then(
                    cache => {

                        return cache.addAll(
                            APP_FILES
                        );

                    }
                )

        );


        self.skipWaiting();
    }
);



/* =========================================
   ACTIVATE
========================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(
                    cacheNames => {

                        return Promise.all(

                            cacheNames.map(
                                cacheName => {

                                    if (
                                        cacheName !==
                                        CACHE_NAME
                                    ) {

                                        return caches.delete(
                                            cacheName
                                        );

                                    }

                                }
                            )

                        );

                    }
                )

        );


        self.clients.claim();
    }
);



/* =========================================
   FETCH
========================================= */

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;


        /*
         * Don't cache POST requests.
         */

        if (
            request.method !==
            "GET"
        ) {

            return;
        }


        const url =
            new URL(
                request.url
            );


        /*
         * Spotify API routes must
         * always use live data.
         */

        if (
            url.pathname.startsWith(
                "/api/"
            )
        ) {

            return;
        }


        /*
         * Network first.
         */

        event.respondWith(

            fetch(
                request
            )
            .then(
                response => {

                    if (
                        response &&
                        response.ok &&
                        url.origin ===
                        self.location.origin
                    ) {

                        const copy =
                            response.clone();


                        caches
                            .open(
                                CACHE_NAME
                            )
                            .then(
                                cache => {

                                    cache.put(
                                        request,
                                        copy
                                    );

                                }
                            );
                    }


                    return response;

                }
            )
            .catch(
                async () => {

                    const cached =
                        await caches.match(
                            request
                        );


                    if (
                        cached
                    ) {

                        return cached;
                    }


                    if (
                        request.mode ===
                        "navigate"
                    ) {

                        return caches.match(
                            "/"
                        );
                    }

                }
            )

        );
    }
);
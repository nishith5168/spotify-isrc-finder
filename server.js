const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT =
    process.env.PORT || 3000;


/* =========================================
   MIDDLEWARE
========================================= */

app.use(
    express.json()
);

app.use(
    express.static("public")
);


/* =========================================
   SPOTIFY ACCESS TOKEN
========================================= */

async function getSpotifyToken() {

    const clientId =
        process.env.SPOTIFY_CLIENT_ID;

    const clientSecret =
        process.env.SPOTIFY_CLIENT_SECRET;


    if (
        !clientId ||
        !clientSecret
    ) {

        throw new Error(
            "Spotify credentials are missing."
        );
    }


    const credentials =
        Buffer
            .from(
                `${clientId}:${clientSecret}`
            )
            .toString(
                "base64"
            );


    const response =
        await fetch(
            "https://accounts.spotify.com/api/token",
            {
                method:
                    "POST",

                headers: {

                    Authorization:
                        `Basic ${credentials}`,

                    "Content-Type":
                        "application/x-www-form-urlencoded"

                },

                body:
                    "grant_type=client_credentials"
            }
        );


    const data =
        await response.json();


    if (
        !response.ok
    ) {

        console.error(
            "Spotify token error:",
            data
        );


        throw new Error(
            "Could not connect to Spotify."
        );
    }


    return data.access_token;
}



/* =========================================
   SEARCH SONG
========================================= */

app.post(
    "/api/search",

    async (
        req,
        res
    ) => {

        try {

            const {
                query,
                offset = 0
            } = req.body;


            if (
                !query ||
                !query.trim()
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Please enter a song name."
                    });
            }


            const token =
                await getSpotifyToken();


            const safeOffset =
                Math.max(
                    0,
                    parseInt(
                        offset
                    ) || 0
                );


            const searchUrl =
                "https://api.spotify.com/v1/search" +
                `?q=${encodeURIComponent(query)}` +
                "&type=track" +
                "&limit=10" +
                `&offset=${safeOffset}`;


            const response =
                await fetch(
                    searchUrl,
                    {
                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok
            ) {

                console.error(
                    "Spotify search error:",
                    data
                );


                return res
                    .status(
                        response.status
                    )
                    .json({
                        error:
                            "Spotify search failed."
                    });
            }


            const tracks =
                data.tracks.items.map(
                    track => {

                        return {

                            id:
                                track.id,

                            name:
                                track.name,

                            artist:
                                track.artists
                                    .map(
                                        artist =>
                                            artist.name
                                    )
                                    .join(", "),

                            album:
                                track.album.name,

                            image:
                                track.album
                                    .images[0]
                                    ?.url || "",

                            isrc:
                                track.external_ids
                                    ?.isrc || ""

                        };

                    }
                );


            res.json({

                tracks:
                    tracks,

                total:
                    data.tracks.total,

                offset:
                    safeOffset,

                nextOffset:
                    safeOffset +
                    tracks.length,

                hasMore:
                    Boolean(
                        data.tracks.next
                    )

            });

        }

        catch (error) {

            console.error(
                "Search route error:",
                error
            );


            res
                .status(500)
                .json({
                    error:
                        "Something went wrong with the Spotify API."
                });
        }
    }
);



/* =========================================
   SPOTIFY TRACK LINK LOOKUP
========================================= */

app.post(
    "/api/track",

    async (
        req,
        res
    ) => {

        try {

            const {
                url
            } = req.body;


            if (
                !url
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Please provide a Spotify link."
                    });
            }


            const match =
                url.match(
                    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/
                );


            if (
                !match
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Invalid Spotify track link."
                    });
            }


            const trackId =
                match[1];


            const token =
                await getSpotifyToken();


            const response =
                await fetch(
                    `https://api.spotify.com/v1/tracks/${trackId}`,
                    {
                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }
                    }
                );


            const track =
                await response.json();


            if (
                !response.ok
            ) {

                console.error(
                    "Spotify track error:",
                    track
                );


                return res
                    .status(
                        response.status
                    )
                    .json({
                        error:
                            "Could not find that Spotify track."
                    });
            }


            res.json({

                id:
                    track.id,

                name:
                    track.name,

                artist:
                    track.artists
                        .map(
                            artist =>
                                artist.name
                        )
                        .join(", "),

                album:
                    track.album.name,

                image:
                    track.album
                        .images[0]
                        ?.url || "",

                isrc:
                    track.external_ids
                        ?.isrc || ""

            });

        }

        catch (error) {

            console.error(
                "Track route error:",
                error
            );


            res
                .status(500)
                .json({
                    error:
                        "Something went wrong with the Spotify API."
                });
        }
    }
);



/* =========================================
   HEALTH CHECK
========================================= */

app.get(
    "/api/health",

    (
        req,
        res
    ) => {

        res.json({
            status:
                "ok"
        });

    }
);



/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );


        console.log(
            `Local: http://localhost:${PORT}`
        );

    }
);
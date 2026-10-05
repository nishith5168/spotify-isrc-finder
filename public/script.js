const input =
    document.getElementById("spotifyUrl");

const result =
    document.getElementById("result");

const recentSearches =
    document.getElementById("recentSearches");

const clearButton =
    document.getElementById("clearSearch");

const resultsHeader =
    document.getElementById("results-header");

const resultsCount =
    document.getElementById("results-count");

const loadMoreContainer =
    document.getElementById("loadMoreContainer");

const loadMoreButton =
    document.getElementById("loadMoreButton");

const loadMoreText =
    document.getElementById("loadMoreText");

const searchBox =
    document.getElementById("searchBox");

const shareButton =
    document.getElementById("shareButton");

const installAppButton =
    document.getElementById("installAppButton");

const installModal =
    document.getElementById("installModal");

const installInstructions =
    document.getElementById("installInstructions");


let currentQuery = "";

let currentOffset = 0;

let totalResults = 0;

let hasMoreResults = false;

let deferredInstallPrompt =
    null;



/* =========================================
   SEARCH
========================================= */

async function searchSong() {

    const query =
        input.value.trim();


    if (!query) {

        showToast(
            "Please enter a song or Spotify link."
        );

        input.focus();

        return;
    }


    currentQuery =
        query;

    currentOffset =
        0;


    saveRecentSearch(
        query
    );


    showMainLoader();


    resultsHeader.classList.add(
        "hidden"
    );


    loadMoreContainer.classList.add(
        "hidden"
    );


    try {

        /*
         * Spotify track URL
         */

        if (
            isSpotifyTrackUrl(
                query
            )
        ) {

            const response =
                await fetch(
                    "/api/track",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                url:
                                    cleanSpotifyUrl(
                                        query
                                    )
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Could not find that Spotify track."
                );
            }


            result.innerHTML =
                "";


            displayTrack(
                data
            );


            resultsHeader
                .classList
                .remove(
                    "hidden"
                );


            resultsCount.textContent =
                "1 result";


            shareButton
                .classList
                .remove(
                    "hidden"
                );


            return;
        }


        /*
         * Normal Spotify search
         */

        const response =
            await fetch(
                "/api/search",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            query:
                                query,

                            offset:
                                0
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Search failed."
            );
        }


        result.innerHTML =
            "";


        if (
            !Array.isArray(
                data.tracks
            )
        ) {

            throw new Error(
                "Invalid response from the server."
            );
        }


        if (
            data.tracks.length === 0
        ) {

            showNoResults();

            return;
        }


        data.tracks.forEach(
            track => {

                displayTrack(
                    track
                );

            }
        );


        currentOffset =
            data.nextOffset ||
            data.tracks.length;


        totalResults =
            data.total ||
            data.tracks.length;


        hasMoreResults =
            Boolean(
                data.hasMore
            );


        updateResultsUI();

    }

    catch (error) {

        console.error(
            error
        );


        result.innerHTML = `

            <div class="error-card">

                <div class="error-icon">
                    !
                </div>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;


        resultsHeader
            .classList
            .add(
                "hidden"
            );


        loadMoreContainer
            .classList
            .add(
                "hidden"
            );
    }
}



/* =========================================
   LOADER
========================================= */

function showMainLoader() {

    result.innerHTML = `

        <div class="loader-container">

            <div class="glass-orb"></div>

            <p class="loader-text">
                Finding tracks...
            </p>

        </div>

    `;
}



/* =========================================
   NO RESULTS
========================================= */

function showNoResults() {

    result.innerHTML = `

        <div class="error-card">

            <div class="error-icon">
                ?
            </div>

            <h3>
                No songs found
            </h3>

            <p>
                Try another song title or artist.
            </p>

        </div>

    `;


    resultsHeader
        .classList
        .add(
            "hidden"
        );


    loadMoreContainer
        .classList
        .add(
            "hidden"
        );
}



/* =========================================
   LOAD MORE
========================================= */

async function loadMore() {

    if (
        !currentQuery ||
        !hasMoreResults
    ) {

        return;
    }


    loadMoreButton.disabled =
        true;


    loadMoreText.innerHTML = `

        <span class="small-loader"></span>

        Loading...

    `;


    try {

        const response =
            await fetch(
                "/api/search",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            query:
                                currentQuery,

                            offset:
                                currentOffset
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not load more songs."
            );
        }


        data.tracks.forEach(
            track => {

                displayTrack(
                    track
                );

            }
        );


        currentOffset =
            data.nextOffset ||
            currentOffset +
            data.tracks.length;


        totalResults =
            data.total ||
            totalResults;


        hasMoreResults =
            Boolean(
                data.hasMore
            );


        updateResultsUI();

    }

    catch (error) {

        console.error(
            error
        );


        showToast(
            error.message ||
            "Could not load more songs."
        );

    }

    finally {

        loadMoreButton.disabled =
            false;


        loadMoreText.textContent =
            "See More";
    }
}



/* =========================================
   RESULTS UI
========================================= */

function updateResultsUI() {

    resultsHeader
        .classList
        .remove(
            "hidden"
        );


    shareButton
        .classList
        .remove(
            "hidden"
        );


    const visibleCount =
        document
            .querySelectorAll(
                ".track"
            )
            .length;


    resultsCount.textContent =
        `${visibleCount} of ${totalResults} results`;


    if (
        hasMoreResults
    ) {

        loadMoreContainer
            .classList
            .remove(
                "hidden"
            );

    }

    else {

        loadMoreContainer
            .classList
            .add(
                "hidden"
            );
    }
}



/* =========================================
   DISPLAY TRACK
========================================= */

function displayTrack(track) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "track";


    const hasIsrc =
        track.isrc &&
        track.isrc.trim() !== "";


    const isrcContent =
        hasIsrc
            ? `

                <div class="isrc-value">
    isrc:${escapeHtml(track.isrc)}
</div>


                <button
                    class="copy-button"
                    onclick="copyISRC('${escapeForAttribute(track.isrc)}', this)"
                    type="button"
                >

                    <span class="copy-icon">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                        >

                            <rect
                                x="8"
                                y="8"
                                width="11"
                                height="11"
                                rx="2"
                            ></rect>

                            <path
                                d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                            ></path>

                        </svg>

                    </span>


                    <span class="copy-text">
                        Copy ISRC
                    </span>

                </button>

            `
            : `

                <div class="isrc-unavailable">
                    ISRC not available
                </div>

            `;


    const artwork =
        track.image
            ? `

                <img
                    class="album-art"
                    src="${escapeForAttribute(track.image)}"
                    alt="${escapeForAttribute(track.name)} album artwork"
                    loading="lazy"
                >

            `
            : `

                <div class="album-placeholder">
                    ♪
                </div>

            `;


    card.innerHTML = `

        <div class="track-main">

            ${artwork}


            <div class="track-info">

                <h3>
                    ${escapeHtml(track.name)}
                </h3>


                <p class="artist">
                    ${escapeHtml(track.artist)}
                </p>


                <p class="album">
                    ${escapeHtml(track.album)}
                </p>

            </div>

        </div>


        <div class="isrc-section">

            <div class="isrc-row">

                ${isrcContent}

            </div>

        </div>


        <div class="track-actions">

            <a
                class="spotify-button"
                href="https://open.spotify.com/track/${encodeURIComponent(track.id)}"
                target="_blank"
                rel="noopener noreferrer"
            >

                <span class="spotify-dot"></span>

                Open in Spotify

            </a>

        </div>

    `;


    result.appendChild(
        card
    );
}



/* =========================================
   COPY ISRC
========================================= */

async function copyISRC(
    isrc,
    button
) {

    try {

        await navigator
    .clipboard
    .writeText(
        `isrc:${isrc}`
    );


        const text =
            button.querySelector(
                ".copy-text"
            );


        const icon =
            button.querySelector(
                ".copy-icon"
            );


        text.textContent =
            "Copied";


        icon.innerHTML = `

            <svg
                viewBox="0 0 24 24"
                fill="none"
            >

                <path
                    d="M5 12.5L9.5 17L19 7.5"
                ></path>

            </svg>

        `;


        button.classList.add(
            "copied"
        );


        showToast(
            "ISRC copied!"
        );


        setTimeout(
            () => {

                text.textContent =
                    "Copy ISRC";


                icon.innerHTML = `

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                    >

                        <rect
                            x="8"
                            y="8"
                            width="11"
                            height="11"
                            rx="2"
                        ></rect>

                        <path
                            d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                        ></path>

                    </svg>

                `;


                button.classList.remove(
                    "copied"
                );

            },
            1500
        );

    }

    catch (error) {

        console.error(
            error
        );


        showToast(
            "Could not copy ISRC."
        );
    }
}



/* =========================================
   CLEAR SEARCH
========================================= */

function clearSearch() {

    input.value =
        "";


    result.innerHTML =
        "";


    resultsHeader
        .classList
        .add(
            "hidden"
        );


    loadMoreContainer
        .classList
        .add(
            "hidden"
        );


    currentQuery =
        "";


    currentOffset =
        0;


    totalResults =
        0;


    hasMoreResults =
        false;


    updateClearButton();


    input.focus();
}



/* =========================================
   RECENT SEARCHES
========================================= */

function saveRecentSearch(
    query
) {

    let searches =
        JSON.parse(
            localStorage.getItem(
                "recentSearches"
            ) || "[]"
        );


    searches =
        searches.filter(
            item =>
                item.toLowerCase() !==
                query.toLowerCase()
        );


    searches.unshift(
        query
    );


    searches =
        searches.slice(
            0,
            6
        );


    localStorage.setItem(
        "recentSearches",
        JSON.stringify(
            searches
        )
    );


    renderRecentSearches();
}



function renderRecentSearches() {

    const searches =
        JSON.parse(
            localStorage.getItem(
                "recentSearches"
            ) || "[]"
        );


    if (
        !searches.length
    ) {

        recentSearches.innerHTML =
            "";

        return;
    }


    recentSearches.innerHTML = `

        <div class="recent-header">

            <span>
                Recent
            </span>


            <button
                onclick="clearRecentSearches()"
                type="button"
            >
                Clear
            </button>

        </div>


        <div class="recent-list">

            ${searches.map(
                search => `

                    <button
                        class="recent-item"
                        onclick="useRecentSearch('${escapeForAttribute(search)}')"
                        type="button"
                    >
                        ${escapeHtml(search)}
                    </button>

                `
            ).join("")}

        </div>

    `;
}



function useRecentSearch(
    query
) {

    input.value =
        query;


    updateClearButton();


    searchSong();
}



function clearRecentSearches() {

    localStorage.removeItem(
        "recentSearches"
    );


    renderRecentSearches();


    showToast(
        "Recent searches cleared."
    );
}



/* =========================================
   SHARE
========================================= */

async function shareResults() {

    if (
        !currentQuery
    ) {

        return;
    }


    const shareData = {

        title:
            "Spotify ISRC Finder",

        text:
            `Find ISRC codes for "${currentQuery}" with Spotify ISRC Finder.`,

        url:
            window.location.href
    };


    try {

        if (
            navigator.share
        ) {

            await navigator.share(
                shareData
            );

            return;
        }


        await navigator
            .clipboard
            .writeText(
                window.location.href
            );


        showToast(
            "Link copied!"
        );

    }

    catch (error) {

        if (
            error.name !==
            "AbortError"
        ) {

            showToast(
                "Could not share the page."
            );
        }
    }
}



/* =========================================
   SPOTIFY URL
========================================= */

function isSpotifyTrackUrl(
    value
) {

    return /open\.spotify\.com\/track\/[a-zA-Z0-9]+/i.test(
        value
    );
}



function cleanSpotifyUrl(
    value
) {

    const match =
        value.match(
            /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/i
        );


    if (
        !match
    ) {

        return value;
    }


    return `https://open.spotify.com/track/${match[1]}`;
}



/* =========================================
   DRAG AND DROP
========================================= */

searchBox.addEventListener(
    "dragover",
    event => {

        event.preventDefault();


        searchBox
            .classList
            .add(
                "drag-over"
            );
    }
);



searchBox.addEventListener(
    "dragleave",
    () => {

        searchBox
            .classList
            .remove(
                "drag-over"
            );
    }
);



searchBox.addEventListener(
    "drop",
    event => {

        event.preventDefault();


        searchBox
            .classList
            .remove(
                "drag-over"
            );


        const text =
            event.dataTransfer
                .getData(
                    "text"
                )
                .trim();


        if (
            text
        ) {

            input.value =
                text;


            updateClearButton();


            searchSong();
        }
    }
);



/* =========================================
   KEYBOARD
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "/" &&
            document.activeElement !==
            input
        ) {

            event.preventDefault();

            input.focus();
        }


        if (
            event.key === "Escape"
        ) {

            clearSearch();
        }


        if (
            event.key === "Enter" &&
            document.activeElement ===
            input
        ) {

            searchSong();
        }
    }
);



/* =========================================
   INPUT
========================================= */

input.addEventListener(
    "input",
    updateClearButton
);



function updateClearButton() {

    const hasText =
        input.value.trim() !==
        "";


    clearButton.style.opacity =
        hasText
            ? "1"
            : "0";


    clearButton.style.pointerEvents =
        hasText
            ? "auto"
            : "none";
}



/* =========================================
   TOAST
========================================= */

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimeout
    );


    window.toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}



/* =========================================
   THEME
========================================= */

function toggleTheme() {

    const currentTheme =
        document
            .documentElement
            .getAttribute(
                "data-theme"
            );


    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    document
        .documentElement
        .setAttribute(
            "data-theme",
            newTheme
        );


    localStorage.setItem(
        "theme",
        newTheme
    );


    updateThemeButton(
        newTheme
    );
}



function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (
        savedTheme
    ) {

        document
            .documentElement
            .setAttribute(
                "data-theme",
                savedTheme
            );


        updateThemeButton(
            savedTheme
        );
    }
}



function updateThemeButton(
    theme
) {

    document.getElementById(
        "themeToggle"
    ).textContent =
        theme === "dark"
            ? "☀️"
            : "🌙";
}



/* =========================================
   INSTALL APP
========================================= */

function isIOS() {

    return /iphone|ipad|ipod/i.test(
        navigator.userAgent
    );
}



function isAndroid() {

    return /android/i.test(
        navigator.userAgent
    );
}



function isInstalled() {

    return (
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches ||

        window.navigator.standalone ===
            true
    );
}



/*
 * Show install button on both
 * desktop AND mobile.
 */

function updateInstallButton() {

    if (
        !installAppButton
    ) {

        return;
    }


    if (
        !isInstalled()
    ) {

        installAppButton
            .classList
            .remove(
                "hidden"
            );


        installAppButton
            .classList
            .add(
                "install-visible"
            );

    }

    else {

        installAppButton
            .classList
            .add(
                "hidden"
            );


        installAppButton
            .classList
            .remove(
                "install-visible"
            );
    }
}



/*
 * Chrome, Edge and other Chromium
 * browsers send this event when
 * the PWA can be installed.
 */

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();


        deferredInstallPrompt =
            event;


        updateInstallButton();
    }
);



async function installApp() {

    if (
        isInstalled()
    ) {

        showToast(
            "The app is already installed."
        );

        return;
    }


    /*
     * Chrome / Edge / Android
     */

    if (
        deferredInstallPrompt
    ) {

        deferredInstallPrompt.prompt();


        const choice =
            await deferredInstallPrompt
                .userChoice;


        deferredInstallPrompt =
            null;


        if (
            choice.outcome ===
            "accepted"
        ) {

            showToast(
                "App installed!"
            );
        }


        updateInstallButton();


        return;
    }


    /*
     * iPhone / iPad
     */

    if (
        isIOS()
    ) {

        showInstallInstructions(
            "In Safari, tap the Share button, then choose “Add to Home Screen”."
        );

        return;
    }


    /*
     * Android browser fallback
     */

    if (
        isAndroid()
    ) {

        showInstallInstructions(
            "Open your browser menu and choose “Install app” or “Add to Home screen”."
        );

        return;
    }


    /*
     * Desktop fallback
     */

    showInstallInstructions(
        "In Chrome or Edge, open the browser menu and choose “Install Spotify ISRC Finder” or “Install app”."
    );
}



function showInstallInstructions(
    message
) {

    installInstructions.textContent =
        message;


    installModal
        .classList
        .remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";
}



function closeInstallModal(
    event
) {

    /*
     * If user clicked inside the
     * modal card, don't close.
     */

    if (
        event &&
        event.target !==
        installModal
    ) {

        return;
    }


    installModal
        .classList
        .add(
            "hidden"
        );


    document.body.style.overflow =
        "";
}



window.addEventListener(
    "appinstalled",
    () => {

        deferredInstallPrompt =
            null;


        updateInstallButton();


        showToast(
            "ISRC Finder installed!"
        );
    }
);



/* =========================================
   SERVICE WORKER
========================================= */

function registerServiceWorker() {

    if (
        "serviceWorker" in
        navigator
    ) {

        window.addEventListener(
            "load",
            () => {

                navigator
                    .serviceWorker
                    .register(
                        "/service-worker.js"
                    )
                    .then(
                        registration => {

                            console.log(
                                "Service Worker registered:",
                                registration.scope
                            );

                        }
                    )
                    .catch(
                        error => {

                            console.error(
                                "Service Worker registration failed:",
                                error
                            );

                        }
                    );

            }
        );
    }
}



/* =========================================
   ESCAPE
========================================= */

function escapeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}



function escapeForAttribute(
    value
) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}



/* =========================================
   INITIALIZE
========================================= */

loadTheme();

renderRecentSearches();

updateClearButton();

updateInstallButton();

registerServiceWorker();



window.addEventListener(
    "resize",
    updateInstallButton
);
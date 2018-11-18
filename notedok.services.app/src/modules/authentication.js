"use strict";

const Util = require("./util");
const NoteStorageDropbox = require("./storage-dropbox");
const NoteStorageDebug = require("./storage-debug");

const CLIENT_ID = "y9i1eshn74yuenq";
const AUTH_STATE_KEY = "authstate";

function generateNewAuthState() {
    // Generate a pseudo-random number for state
    let rnd = Math.random();
    let time = new Date().getTime();
    let state = (rnd * time).toString();

    sessionStorage.setItem(AUTH_STATE_KEY, state);

    return state;
}

function getSavedAuthState() {
    return sessionStorage.getItem(AUTH_STATE_KEY);
}

function authorizeAtDropBox() {
    window.location.replace(
        "https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=" + CLIENT_ID +
        "&redirect_uri=" + encodeURIComponent(Util.getLocationOrigin()) +
        "&state=" + encodeURIComponent(generateNewAuthState()));
}

// Authenticates user and returns the storage object
function authenticate() {
    let oauthParams = Util.parseHashParams();
    let fileStorage;

    let error = oauthParams["error"];
    if (error) {
        // Stay on the redirected page, block the app
        return null;
    }

    let token = oauthParams["access_token"];
    if (token) {
        if (token === "debug") {
            fileStorage = NoteStorageDebug;
            // TODO: indicate debug mode
        } else {
            // Verify the state
            let state = oauthParams["state"];
            if (!state || state !== getSavedAuthState()) {
                // TODO: error message

                // Stay on the redirected page, block the app
                return null;
            }

            fileStorage = NoteStorageDropbox;
        }

        fileStorage.token = token;

        // Tidy up the url
        // TODO: potentially re-create an original hash = require(the state
        // TODO: search string currently is lost
        location.hash = "";

        // Allow the app to continue
        return fileStorage;
    } else {
        // No token found and no error - redirect to authentication page
        authorizeAtDropBox();
    }

    // Block the app
    return null;
}

const authentication = {
    authenticate: authenticate
};

module.exports = authentication;
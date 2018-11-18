"use strict";

const $ = require("jquery");
const UserInterface = require("./modules/ui");
const Conversion = require("./modules/conversion");
const Util = require("./modules/util");
require("./notedok.css");
require("./spinner.css");

var hashParams = Util.parseHashParams();
var dropBoxLink = hashParams.link;
var parsedLink = Util.parseUrl(dropBoxLink);

var noteFileName = parsedLink.hash.substr(0, parsedLink.hash.indexOf("?"));
var downloadLink = "https://dl.dropboxusercontent.com" + parsedLink.pathname + encodeURIComponent(noteFileName);
$.ajax({
    url: downloadLink,
    dataType: "text",
    crossDomain: true,
    async: true,
    success: function (data) {
        UserInterface.renderSharedNote(Conversion.titleToPathCoverter.getTitleFromPath(decodeURIComponent(downloadLink)), data);
    },
    error: function () {
        // TODO: error view
    }
});
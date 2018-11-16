"use strict";

import Util from "./util";

const TITLE_POSTFIX_SEPARATOR = "~~";

function getTitleFromPath(path) {
    let filename = path.substring(path.lastIndexOf('/') + 1);
    let fileNameWithoutExtension = filename.slice(0, -4);

    let title = fileNameWithoutExtension;

    let separatorIndex = title.lastIndexOf(TITLE_POSTFIX_SEPARATOR);
    if (separatorIndex >= 0) {
        title = title.substring(0, separatorIndex);
    }

    title = Util.decodePathFileSystemFriendly(title);

    return title;
}

function generatePathFromTitle(note, ensureUniqie) {
    let postfix = "";
    if (ensureUniqie || !note.Title) {
        let date = new Date();
        let n = date.getTime();
        postfix = TITLE_POSTFIX_SEPARATOR + n;
    }
    return "/" + Util.encodePathFileSystemFriendly(note.Title) + postfix + ".txt";
}

const conversion = {
    getTitleFromPath: getTitleFromPath,
    generatePathFromTitle: generatePathFromTitle
};

export default conversion;
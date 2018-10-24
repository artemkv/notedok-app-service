"use strict";

function extractMetadataFromSearchResult(result) {
    return result.matches.map(function searchResultToMetadata(x) {
        return x.metadata;
    });
}

function extractMetadataFromListFolderResult(result) {
    return result.entries.map(function listFolderResult(x) {
        return x;
    });
}

function getFileListFromMetadata(metadata) {
    let fileList = [];
    for (let i = 0, len = metadata.length; i < len; i++) {
        let fileMetadata = metadata[i];

        // Only take files with ".txt" extension
        if (fileMetadata[".tag"] === "file" && fileMetadata.path_lower.slice(-4) === ".txt") {
            fileList.push(
                {
                    path: "/" + fileMetadata.name,
                    modified: new Date(fileMetadata.server_modified)
                });
        }
    }
    return fileList
        .sort(function compareByModified(a, b) {
            return b.modified.getTime() - a.modified.getTime();
        })
        .map(function mapToPath(x) {
            return x.path;
        });
}

function getPathFromMetadata(metadata) {
    if (!metadata || !metadata.name) return "";
    return "/" + metadata.name;
}

const storage = {
    token: null,

    // Retrieves the list of files that are in the application folder. Every record in the file list is the file path in the format "/my file.txt".
    // File paths are returned as the are, no additional processing is done by this method. Business code is supposed to be able to properly convert the file path to the note title by its own means.
    // Only text files are retrieved (files that have extension ".txt").
    // Only files from the root folder are retrieved. Subfolders are ignored.
    // When no searchString is provided, all files are retrieved - the result can be used to build the auto-suggest source. // TODO: might require multiple calls when number of files grows too big
    // When searchString is provided, the number of retrieved files is limitited to 1000. To get the files that are cut off, user need to provide more specific search string.
    // The search is implemented by means of Dropbox API. This method does not provide any search logic of its own.
    // The results are currently not in any particular order. // TODO: maybe it makes sense to sort returned files by date
    retrieveFileList: function retrieveFileList(searchString, onSuccess, onError) { // TODO: convert to promise
        if (searchString) {
            var url = "https://api.dropboxapi.com/2/files/search";
            var args = {
                path: "",
                query: searchString,
                max_results: 1000
            };
        } else {
            var url = "https://api.dropboxapi.com/2/files/list_folder";
            // TODO: now we are simply ignoring the "has_more" in the response.
            // So, there is a possibility that not all the files are retrieved. Don't see the limit documented.
            var args = {
                path: ""
            };
        }

        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            headers: {
                ["Authorization"]: "Bearer " + encodeURIComponent(this.token)
            },
            async: true,
            data: JSON.stringify(args),
            success: function (data) {
                if (searchString) {
                    var metadata = extractMetadataFromSearchResult(data);
                }
                else {
                    var metadata = extractMetadataFromListFolderResult(data);
                }

                var fileList = getFileListFromMetadata(metadata);
                onSuccess(fileList);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.responseText) {
                    console.log(jqXHR.responseText);
                }
                onError(errorThrown);
            }
        });
    },

    // Retrieves the note text as a string.
    // The note is supposed to have Path property set to file path in format "/my file.txt" (exactly as retrieved by retrieveFileList).
    // Dropbox API returns the file content as is, in the form of binary stream.
    // The method is supposed to convert whatever encoding was used in the file to UTF-16 string (DomString).
    // This conversion is normally ensured by the browser, when the string is obtained from XMLHttpRequest.responseText.
    getNoteContent: function getNoteContent(note, onSuccess, onError) {
        let args = {
            path: note.Path
        };

        // Cannot pass args using header because it fails for filenames with international characters.
        let url = "https://content.dropboxapi.com/2/files/download?arg=" + encodeURIComponent(JSON.stringify(args));

        $.ajax({
            url: url,
            type: "POST",
            dataType: "text",
            headers: {
                ["Authorization"]: "Bearer " + encodeURIComponent(this.token)
            },
            async: true,
            success: function (data) {
                onSuccess(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.responseText) {
                    console.log(jqXHR.responseText);
                }
                onError(errorThrown);
            }
        });
    },

    // Renames the note by changing the corresponding file path to the newPath. The file paths are in the format "/my file.txt".
    // File paths are taken as the are, no additional processing is done by this method. Business code is supposed to be able to properly convert the note title to the file path by its own means.
    // That means that the newPath is supposed to be file system-friendly, and don't use any special characters that are not allowed by any existing file system.
    // In practice that means it should not contain any of the following characters: /?<>\:*|"^
    // The file with oldPath is supposed to exist, ot the error will be returned.
    // If the note with newPath already exists, the method will return a non-specific error. The caller is supposed to enforce the uniqueness of the file by its own means and try again.
    // Uniqueness can be ensured by applying the timestamp to the file path, i.e. "/my file~~1426963430173.txt"
    renameNote: function renameNote(oldPath, newPath, onSuccess, onError) {
        let url = "https://api.dropboxapi.com/2/files/move";

        let args = {
            from_path: oldPath,
            to_path: newPath
        };

        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            headers: {
                ["Authorization"]: "Bearer " + encodeURIComponent(this.token)
            },
            async: true,
            data: JSON.stringify(args),
            success: function () {
                onSuccess();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.responseText) {
                    console.log(jqXHR.responseText);
                }
                onError(errorThrown);
            }
        });
    },

    // Saves the note text to the file with path specified in the Path property.
    // The note is supposed to have Path property set to file path in format "/my file.txt" (exactly as retrieved by retrieveFileList).
    // Dropbox API treats the passed data as a binary stream and saves it to the file without any extra processing.
    // The methos is supposed to convert the UTF-16 string (DomString) to the byte array using the correct encoding.
    // This conversion is normally ensured by the browser, when calling XMLHttpRequest.send method.
    // The string is encoded in UTF-8 without the UTF-8 signature (EF BB BF). // TODO: It might be better to use Blob constructor to ensure the desired encoding with correct signature (byte order mark).
    //
    // If the note with the same path already exists, parameter "overwrite" controls the method behavior.
    // For a new note, overwrite should be set to false to avoid replacing the existing note. If the note with the same path already exists, this method will auto-rename the note.
    // Auto-rename is implemented by means of Dropbox API according their auto-rename strategy.
    // To avoid that the new note changes its title after saving, caller is supposed to analize the returned path, detect auto-rename and rename it again ensuring the uniqueness by its own means.
    // Uniqueness can be ensured by applying the timestamp to the file path, i.e. "/my file~~1426963430173.txt"
    //
    // For an existing note, overwrite should be set to true, to avoid creating a second copy of the same note.
    //
    // When restoring a deleted note, overwrite should be set to false, to avoid replacing the existing note. If the note with the same path already exists, this method will auto-rename the note.
    // It is OK for the restored note to keep the auto-renamed path.
    //
    // Empty path is not allowed. If the note title is empty, the caller is supposed to ensure the path is non-empty, by applying the timestamp to the file path, i.e. "/~~1426963430173.txt"
    // When note is saved successfully, this method returns the actual path the note is saved to.
    saveNote: function saveNote(note, overwrite, onSuccess, onError) {
        let args = {
            path: note.Path
        };

        // TODO: when file size is 0 bytes, add + autorename is not applied. Maybe check with Dropbox support
        if (overwrite) {
            args.mode = "overwrite";
        } else {
            args.mode = "add";
            args.autorename = true;
        }

        // Cannot pass args using header because it fails for filenames with international characters.
        let url = "https://content.dropboxapi.com/2/files/upload?arg=" + encodeURIComponent(JSON.stringify(args));

        // TODO: this converts the text to utf-8 without byte order mark (same as before). Consider using Blob to convert the string to the byte array with byte order mark. The Blob is available in IE from version 10.
        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/octet-stream",
            dataType: "json",
            headers: {
                ["Authorization"]: "Bearer " + encodeURIComponent(this.token)
            },
            async: true,
            data: note.Text,
            success: function (data) {
                onSuccess(getPathFromMetadata(data));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.responseText) {
                    console.log(jqXHR.responseText);
                }
                onError(errorThrown);
            }
        });
    },

    // Deletes the note.
    // The note is supposed to have Path property set to file path in format "/my file.txt" (exactly as retrieved by retrieveFileList).
    deleteNote: function deleteFile(note, onSuccess, onError) {
        let url = "https://api.dropboxapi.com/2/files/delete";

        var args = {
            path: note.Path
        };

        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            headers: {
                ["Authorization"]: "Bearer " + encodeURIComponent(this.token)
            },
            async: true,
            data: JSON.stringify(args),
            success: function () {
                onSuccess();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.responseText) {
                    console.log(jqXHR.responseText);
                }
                onError(errorThrown);
            }
        });
    },

    // Returns the link that can be later used for accessing the note by another user.
    // The returned link is obtained directly from Dropbox API and has no reference to the NotedOK.com.
    // The caller is supposed to pack the link into the NotedOK.com-related link.
    getSharedLink: function getSharedLink(note, onSuccess, onError) {
        var url = "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings";

        var args = {
            path: note.Path
        };

        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            headers: {
                ["Authorization"]: "Bearer " + encodeURIComponent(this.token)
            },
            async: true,
            data: JSON.stringify(args),
            success: function (data) {
                onSuccess(data.url);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.responseText) {
                    console.log(jqXHR.responseText);
                }
                onError(errorThrown);
            }
        });
    }
};

export default storage;
"use strict";

// Module
const storage = {
    token: null,
    retrieveFileList: function retrieveFileList(searchString, onSuccess) {
        let fileList = [];
        if (searchString) {
            fileList = ["file001.txt", "file005.txt", "file014.txt"];
        }
        else {
            fileList = ["file001.txt", "file002.txt", "file003.txt", "file004.txt", "file005.txt",
                "file006.txt", "file007.txt", "file008.txt", "file009.txt", "file010.txt",
                "file011.txt", "file012.txt", "file013.txt", "file014.txt", "file015.txt"];
        }
        onSuccess(fileList);
    },
    getNoteContent: function getNoteContent(note, onSuccess) {
        onSuccess("dummy content of" + note.Path + " <script type='text/javascript'>alert('injected')</script>");
    },
    renameNote: function renameNote() {
    },
    saveNote: function saveNote(note, overwrite, onSuccess) {
        onSuccess(note.Path);
    },
    deleteNote: function deleteNote() {
    },
    getSharedLink: function getSharedLink() {
    }
};

module.exports = storage;
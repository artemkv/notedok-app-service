"use strict";

import Util from "./modules/util";
import UserInterface from "./modules/ui";
import Authentication from "./modules/authentication";
import Conversion from "./modules/conversion";

// Constants
const NOTES_ON_PAGE = 5;
const SEARCH_STRING_DELIMITER = " ";

// Cached storage
let _noteStorage = null;
// The id of the next note to be rendered
let _nextNoteId = 1;
// Allows to access the note by id
let _notesById = {};

let _unprocessedFiles = (function () {
    // File list with file paths for all unrendered notes
    let _fileList = [];
    // The version of the file list, icreased every time the filelist is re-read
    let _fileListVersion = 0;

    return {
        initialize: function initialize(fileList) {
            _fileList = fileList;
            // Raise the version
            _fileListVersion++;
        },
        hasMore: function hasMore() {
            if (_fileList.length) {
                return true;
            }
            return false;
        },
        getLength: function getLength() {
            return _fileList.length;
        },
        shift: function shift() {
            return _fileList.shift();
        },
        clear: function clear() {
            _fileList = [];
            // Raise the version
            _fileListVersion++;
        },
        getVersion: function getVersion() {
            return _fileListVersion;
        }
    };
})();

let _renderingQueue = (function () {
    let _queue = [];
    let _readyNotesById = {};

    return {
        enqueue: function enqueue(note) {
            _queue.push(note);
        },
        markReady: function markReady(note) {
            _readyNotesById[note.Id] = note;
        },
        dequeueReady: function dequeueReady() {
            let readyNotes = [];

            while (_queue.length > 0 && _readyNotesById[_queue[0].Id]) {
                readyNotes.push(_queue.shift());
            }

            return readyNotes;
        },
        clear: function clear() {
            _queue = [];
            _readyNotesById = {};
        }
    };
})();

// The options for auto-suggestion of hash tags
let _hashTagsAutoSuggestOptions = {
    lookup: [],
    lookupLimit: 10,
    minChars: 1,
    delimiter: SEARCH_STRING_DELIMITER,
    maxHeight: 500,
    forceFixPosition: true,
    appendTo: UserInterface.getNoteAutoCompleteSuggestionsContainer(),
    lookupFilter: function (suggestion, query, queryLowerCase) {
        return suggestion.value.toLowerCase().substr(0, queryLowerCase.length) === queryLowerCase;
    }
};

let _hashTagsExtractor = (function () {
    let _autoSuggestHashTagsUsed = {};

    return {
        extractNewHashTags: function extractNewHashTags(title) {
            let newHashTags = [];

            let hashTags = title.split(SEARCH_STRING_DELIMITER);
            for (let j = 0, hashTagsTotal = hashTags.length; j < hashTagsTotal; j++) {
                let hashTag = (hashTags[j]).toLowerCase();
                if (hashTag.length > 1 && hashTag[0] === "#" && !_autoSuggestHashTagsUsed[hashTag]) {
                    newHashTags.push(hashTag);
                    _autoSuggestHashTagsUsed[hashTag] = true;
                }
            }

            return newHashTags;
        }
    };
})();

//#region Business Logic
function showError(error) {
    // TODO: nice error view
    alert(error);
}

function createNote(path) {
    let note = {
        Id: "note_" + _nextNoteId.toString(),
        Path: path,
        Title: Conversion.titleToPathCoverter.getTitleFromPath(path),
        Text: "",
        IsTemplate: false,
        RestoredFrom: ""
    };

    _nextNoteId++;

    _notesById[note.Id] = note; // TODO: remove notes from hashtable once they are removed from dom

    return note;
}

function createTemplateNote() {
    let note = {
        Id: "note_" + _nextNoteId.toString(),
        Path: "",
        Title: "",
        Text: "",
        IsTemplate: true
    };

    _nextNoteId++;

    _notesById[note.Id] = note; // TODO: remove notes from hashtable once they are removed from dom

    return note;
}

function saveNoteTitle(note) {
    function updateNotePath() {
        note.Path = newPath;
    }

    function retryWithUniqueTitle(error) {
        newPath = Conversion.titleToPathCoverter.generatePathFromTitle(note, true);
        _noteStorage.renameNote(note.Path, newPath, updateNotePath, showError);
    }

    let newPath = Conversion.titleToPathCoverter.generatePathFromTitle(note, false);
    _noteStorage.renameNote(note.Path, newPath, updateNotePath, retryWithUniqueTitle);
}

function saveNoteText(note, isNew) {
    // Handles the situation when new note was created with the same title as some existing note
    // Because of overwrite=false we pass when saving the new note, dropbox will rename it to ensure the name is unique
    // We have to catch it and ensure uniqueness by our own means
    function updateNoteTitle(path) {
        function updateNotePath() {
            note.Path = newPath;
        }

        // Always update the note title to the actual value to be able to rename it in the future
        note.Path = path;
        let newTitle = Conversion.titleToPathCoverter.getTitleFromPath(note.Path);

        if (note.Title !== newTitle) {
            // Force the unique title from the user-provided title
            let newPath = Conversion.titleToPathCoverter.generatePathFromTitle(note, true);
            _noteStorage.renameNote(note.Path, newPath, updateNotePath, showError);
        }
    }

    // By default, do nothing
    let onSuccess = function (path) { };
    // If the new note, handle the possible title renaming
    if (isNew) {
        onSuccess = updateNoteTitle;
    }
    // When saving existing file, overwrite. When creating a new file, don't overwrite!
    _noteStorage.saveNote(note, !isNew, onSuccess, showError);
}

function deleteNote(note) {
    // Remove all existing undo notes
    UserInterface.getDeletedNotes().remove();
    // Replace with undo note
    UserInterface.getNoteOuterElement(note.Id).replaceWith(UserInterface.renderDeletedNote(note));
    UserInterface.getNoteRestoreButton(note.Id).one("click", function () { restoreNote(note); });

    // By default, do nothing
    let onSuccess = function () { };
    _noteStorage.deleteNote(note, onSuccess, showError);

    // Load and render one more note from the list (if exists), so the number of displayed notes stays the same
    if (_unprocessedFiles.hasMore()) {
        loadNextNote();
        showHideMoreButton();
    }
}

function convertToRegularNoteAndSave(note) {
    note.IsTemplate = false;
    renderTemplateNote();

    note.Path = Conversion.titleToPathCoverter.generatePathFromTitle(note, false);
    saveNoteText(note, true);

    UserInterface.convertTitleToRegularNoteTitle(note);
    UserInterface.getNoteOuterElement(note.Id).removeClass("template-note");
}

function endAllNotesTextEditing(saveChanges) {
    let editableElements = $(".note-text-editable"); // TODO: class hardcoded
    for (let i = 0, len = editableElements.length; i < len; i++) {
        let editableElement = editableElements[i];
        let editableNoteElement = $(editableElement).closest(".note-outer"); // TODO: class hardcoded
        let noteId = editableNoteElement.attr('id');
        endNoteTextEditing(noteId, saveChanges);
    }
}

function endNoteTextEditing(noteId, saveChanges) {
    let editableElement = UserInterface.getNoteTextEditableElement(noteId);

    // Only if element is there still
    if (editableElement.length) {
        let note = _notesById[noteId];

        if (saveChanges) {
            let newText = editableElement.val();
            if (newText !== note.Text) {
                note.Text = newText;
                if (!note.IsTemplate) {
                    saveNoteText(note, false);
                } else {
                    convertToRegularNoteAndSave(note);
                }
            }
        }

        exitEditingMode(note);
    }
}

function startNoteTextEditing(note) {
    // Ignore text selection
    if (Util.getSelectionText()) return;

    // Save changes for whatever notes were being edited
    endAllNotesTextEditing(true);

    enterEditingMode(note);
}

function enterEditingMode(note) {
    let readonlyElement = UserInterface.getNoteTextElement(note.Id);
    // If is not yet in editing mode
    if (readonlyElement.length) {
        readonlyElement.replaceWith(UserInterface.renderNoteTextEditable(note));
        // The newly created text element gets focus
        UserInterface.getNoteTextEditableElement(note.Id).focus();
    }

    UserInterface.switchModeToEdit(note);
}

function exitEditingMode(note) {
    UserInterface.getNoteTextEditableContainerElement(note.Id).replaceWith(UserInterface.renderNoteTextReadOnly(note));
    bindToTextEvents(note);

    UserInterface.switchModeToView(note);
}

function updateHashTagsAutoSuggestOptions(title) {
    let hashTags = _hashTagsExtractor.extractNewHashTags(title);
    for (let j = 0, hashTagsTotal = hashTags.length; j < hashTagsTotal; j++) {
        let hashTag = hashTags[j];
        _hashTagsAutoSuggestOptions.lookup.push({ value: hashTag, data: hashTag });
    }
    activateAutoSuggestForAllVisibleNotes();
}

function bindToTitleEvents(note) {
    UserInterface.getNoteTitleElement(note.Id).bind("blur", function () {
        let newTitle = $(this).val();
        if (newTitle !== note.Title) {
            note.Title = newTitle;
            if (!note.IsTemplate) {
                saveNoteTitle(note);
            } else {
                convertToRegularNoteAndSave(note);
                // After the title of the template note is modified and new note is created, 
                // the new note automatically goes to the text editing mode
                startNoteTextEditing(note);
            }
            updateHashTagsAutoSuggestOptions(newTitle);
        }
    });
}

function bindToTextEvents(note) {
    UserInterface.getNoteTextElement(note.Id).bind("click", function (e) {
        let target = e.target;
        // TODO: class hardcoded
        if (target && target.nodeName.toUpperCase() === "A" && $(target).closest(".note-text").length) {
            // Don't trigger editing upon following the link
            return;
        }

        startNoteTextEditing(note);
        // Handled
        e.stopPropagation();
    });
}

function shareNote(note) {
    let onSuccess = function (link) {
        let shareLink = Util.getLocationOrigin() + "/Shared#link=" + link;

        let container = UserInterface.getNoteShareLinkContainerElement(note.Id);
        container.empty();
        container.append(UserInterface.renderNoteShareLink(shareLink));
        UserInterface.getNoteShareLinkElement(note.Id).select();
    };
    _noteStorage.getSharedLink(note, onSuccess, showError);
}

function restoreNote(note) {
    let onSuccess = function (path) {
        let restoredNote = createNote(path);
        restoredNote.RestoredFrom = note.Id;
        loadNote(restoredNote);
    };
    _noteStorage.saveNote(note, false, onSuccess, showError);
}

function bindToControlButtonsEvents(note) {
    UserInterface.getNoteEditButton(note.Id).bind("click", function (e) {
        startNoteTextEditing(note);
        // Handled
        e.stopPropagation();
    });
    UserInterface.getNoteDeleteButton(note.Id).bind("click", function () { deleteNote(note); });
    UserInterface.getNoteShareButton(note.Id).bind("click", function () { shareNote(note); });
    UserInterface.getNoteSaveButton(note.Id).bind("click", function () { endAllNotesTextEditing(true); });
    UserInterface.getNoteCancelButton(note.Id).bind("click", function () { endAllNotesTextEditing(false); });
}

function bindNoteToEvents(note) {
    bindToTitleEvents(note);
    bindToTextEvents(note);
    bindToControlButtonsEvents(note);
}

function renderNote(note) {
    let noteHtml = UserInterface.renderNote(note);

    let noteContainer = UserInterface.getNoteContainer();
    if (note.IsTemplate) {
        noteContainer.prepend(noteHtml);
    } else if (note.RestoredFrom) {
        // Replace "undo" note with the restored note
        let undoNote = UserInterface.getNoteOuterElement(note.RestoredFrom);
        if (undoNote.length) {
            undoNote.replaceWith(noteHtml);
        } else {
            noteContainer.append(noteHtml);
        }
    } else {
        noteContainer.append(noteHtml);
    }

    // enable auto-suggest
    (UserInterface.getNoteTitleElement(note.Id)).autocomplete(_hashTagsAutoSuggestOptions);

    bindNoteToEvents(note);
}

function loadNote(note) {
    // Remember for which version of the file list the note is loaded
    let currentFileListVersion = _unprocessedFiles.getVersion();
    function completeLoadNote(content) {
        // Only complete the rendering if the file list is still the same
        if (currentFileListVersion !== _unprocessedFiles.getVersion()) return;

        note.Text = content;
        _renderingQueue.markReady(note);

        let notesReadyForRendering = _renderingQueue.dequeueReady();
        for (let i = 0, len = notesReadyForRendering.length; i < len; i++) {
            renderNote(notesReadyForRendering[i]);
        }
    }

    _renderingQueue.enqueue(note);
    if (!note.IsTemplate) {
        _noteStorage.getNoteContent(note, completeLoadNote, showError);
    } else {
        // Template note is loaded syncronously
        completeLoadNote("");
    }
}

function renderTemplateNote() {
    let note = createTemplateNote();
    loadNote(note);
}

function showHideMoreButton() {
    // If there is more to load
    if (_unprocessedFiles.hasMore()) {
        // If there is no button yet, add it
        if (!UserInterface.getMoreButton().length) {
            UserInterface.getMoreButtonContainer().append(UserInterface.renderMoreButton(_unprocessedFiles.getLength()));

            // Subscribe to events
            let button = UserInterface.getMoreButton();
            button.bind("click", function () {
                loadNextPage();
            });
        }
        else {
            // update the count
            UserInterface.getMoreButtonCount().text(_unprocessedFiles.getLength());
        }
    } else {
        // If there is button, remove it
        let button = UserInterface.getMoreButton();
        if (button.length) {
            button.remove();
        }
    }
}

function loadNextNote() {
    let path = _unprocessedFiles.shift();
    let note = createNote(path);
    loadNote(note);
}

function loadNextPage() {
    let len = NOTES_ON_PAGE;
    if (_unprocessedFiles.getLength() < len) {
        len = _unprocessedFiles.getLength();
    }

    for (let i = 0; i < len; i++) {
        loadNextNote();
    }

    showHideMoreButton();
}

function appendSearchControl() {
    UserInterface.getSearchContainer().append(UserInterface.renderSearchPanel());
    UserInterface.getSearchTextbox().bind("keyup", function (e) {
        if (e.keyCode == 13) {
            window.location.hash = "search=" + encodeURIComponent(UserInterface.getSearchTextbox().val());
        }
    });
}

function getSearchString() {
    let hashParams = Util.parseHashParams();
    if (hashParams.search) {
        return Util.encodePathFileSystemFriendly(hashParams.search);
    }
    return "";
}

function activateAutoSuggestForAllVisibleNotes() {
    UserInterface.getAllNoteTitleElements().each(function applyAutoSuggest(index, elem) {
        ($(elem)).autocomplete(_hashTagsAutoSuggestOptions);
    });
}

function activateAutoSuggest() {
    _noteStorage.retrieveFileList(
        "", // All files are used for auto-suggest
        function (fileList) {
            _hashTagsAutoSuggestOptions.lookup = activateSearchAutoSuggest(fileList);
            // Update already loaded notes, in case there are any
            activateAutoSuggestForAllVisibleNotes();
        },
        showError);
}

// This is a bit dirty, but to save the processing power, the hashtags are not recalculated
function activateSearchAutoSuggest(fileList) {
    let TERM_GROUP = "";
    let TITLE_GROUP = " ";

    let autoSuggestItemsUsed = {};
    let autoSuggestItems = [];

    // Auto-suggest source 1: tokenize
    for (let i = 0, filesTotal = fileList.length; i < filesTotal; i++) {
        let path = fileList[i];
        let title = Conversion.titleToPathCoverter.getTitleFromPath(path);
        let words = Util.getWordsInText(title);
        for (let j = 0, wordsTotal = words.length; j < wordsTotal; j++) {
            let word = (words[j]).toLowerCase();
            if (word.length > 1 && !autoSuggestItemsUsed[word]) {
                autoSuggestItems.push({ value: word, data: { g: TERM_GROUP } });
                autoSuggestItemsUsed[word] = true;
            }
        }
    }

    let autoSuggestHashTags = [];

    // Auto-suggest source 2: hashtags
    for (let i = 0, filesTotal = fileList.length; i < filesTotal; i++) {
        let path = fileList[i];
        let title = Conversion.titleToPathCoverter.getTitleFromPath(path);
        let hashTags = _hashTagsExtractor.extractNewHashTags(title);

        for (let j = 0, hashTagsTotal = hashTags.length; j < hashTagsTotal; j++) {
            let hashTag = hashTags[j];
            autoSuggestItems.push({ value: hashTag, data: { g: TERM_GROUP } });
            autoSuggestHashTags.push({ value: hashTag, data: hashTag });
        }
    }

    // Auto-suggest source 3: use titles
    for (let i = 0, filesTotal = fileList.length; i < filesTotal; i++) {
        let path = fileList[i];
        let title = Conversion.titleToPathCoverter.getTitleFromPath(path);
        autoSuggestItems.push({ value: title, data: { g: TITLE_GROUP } });
    }

    let searchTextBox = UserInterface.getSearchTextbox();
    let options = {
        lookup: autoSuggestItems,
        lookupLimit: 10,
        minChars: 1,
        delimiter: SEARCH_STRING_DELIMITER,
        maxHeight: 500,
        groupBy: "g",
        forceFixPosition: true,
        appendTo: UserInterface.getSearchAutoCompleteSuggestionsContainer(),
        lookupFilter: function (suggestion, query, queryLowerCase) {
            // Allow any term available
            if (suggestion.data.g === TERM_GROUP) {
                // Copy from the source
                return suggestion.value.toLowerCase().indexOf(queryLowerCase) !== -1;
            }

            // For titles, all terms should be in
            let searchText = UserInterface.getSearchTextbox().val().toLowerCase();
            let words = searchText.split(SEARCH_STRING_DELIMITER);
            for (let i = 0, wordsTotal = words.length; i < wordsTotal; i++) {
                let word = words[i];
                if (suggestion.value.toLowerCase().indexOf(word) === -1) {
                    return false; // Doesn't contain one of the terms, so out immediately
                }
            }
            return true;
        }
    };
    searchTextBox.autocomplete(options);

    // Avoid re-calculation of hashtags
    return autoSuggestHashTags;
}

function refreshNotes() {
    // Reset what was already loaded
    _unprocessedFiles.clear();
    _renderingQueue.clear();
    UserInterface.getNoteContainer().empty();
    UserInterface.getNoteAutoCompleteSuggestionsContainer().empty();

    renderTemplateNote();

    // Show progress indicator
    let progressIndicatorHtml = UserInterface.renderProgressIndicator();
    let noteContainer = UserInterface.getNoteContainer();
    noteContainer.append(progressIndicatorHtml);

    // Remember for which version of the file list the note is loaded
    let currentFileListVersion = _unprocessedFiles.getVersion();

    let searchString = getSearchString();
    _noteStorage.retrieveFileList(
        searchString,
        function (fileList) {
            // Only complete the rendering if the file list is still the same
            if (currentFileListVersion !== _unprocessedFiles.getVersion()) return;

            // Suppress progress indicator
            UserInterface.getProgressIndicator().remove();

            _unprocessedFiles.initialize(fileList);
            loadNextPage();
        },
        showError);
}

//#region Event Handlers
function onDocumentClick(event) {
    // Click is not inside the textarea
    if (event.target && !$(event.target).hasClass("note-text-editable")) { // TODO: class hardcoded
        endAllNotesTextEditing(true);
    }
}
//#endregion Event Handlers

function setupEventDelegation() {
    $(document).bind("click", onDocumentClick);
}

function runApplication() {
    let fileStorage = Authentication.authenticate();
    if (fileStorage) {
        _noteStorage = fileStorage;
        setupEventDelegation();
        appendSearchControl();
        //refreshNotes(); // Next line ensures that refreshNotes is called, since authenticate updates hashtag
        $(window).on('hashchange', refreshNotes); // TODO: update the search textbox
        setTimeout(function () { activateAutoSuggest(); }, 1000); // Make sure does not trigger too many requests
    }
}

function initialize() {
    function connect() {
        // Remember that authenticated, to prevent intro next time
        localStorage.setItem("http://notedok.com/", "connected");

        UserInterface.getIntro().remove();
        runApplication();
    }

    let connected = localStorage.getItem("http://notedok.com/");
    if (connected) {
        runApplication();
    } else {
        // Show intro
        let introHtml = UserInterface.renderIntro();
        let noteContainer = UserInterface.getNoteContainer();
        noteContainer.append(introHtml);
        UserInterface.getIntroConnectButton().bind("click", connect);
    }
}
//#endregion Business Logic

initialize();

"use strict";

const $ = require("jquery");

const ShortDelay = 3000;
const MediumDelay = 4000;
const LongDelay = 5000;

// Inject diagnostics panel
$('.search-outer').after('<div class="diag-outer"><div id="diag-container"><button id="run_diag">Run Diagnostics</button><div id="diag_log"></div></div></div>');
$('#run_diag').click(runDiagnostics);

// Runs the complete diagnostics
function runDiagnostics() {
    $('#diag_log').empty();

    var counter = 0;
    var before = new Date();
    startTest('*** ALL TESTS STARTED ***')
        .then(function () { counter++; return testCreateNewNote(); })
        .then(function () { counter++; return testTemplateNote(); })
        .then(function () { counter++; return testCancelTemplateNoteEditing(); })
        .then(function () { counter++; return testEditNoteText(); })
        .then(function () { counter++; return testCancelEditingNoteText(); })
        .then(function () { counter++; return testBasicFormatting(); })
        .then(function () { counter++; return testDeleteNote(); })
        .then(function () { counter++; return testUndoDeleteNote(); })
        .then(function () { counter++; return testSearch(); }) // TODO: broken
        .then(function () { counter++; return testEditNoteTitle(); })
        .then(function () { counter++; return testCreateNewNoteSpecial(); })
        .then(function () { counter++; return testLoadNotesInBatches(); })
        .then(function () { counter++; return testEditNoteMakeTitlesTheSame(); })
        .then(function () { counter++; return testLoadOneMoreNote(); })
        .then(function () { counter++; return testEditNoteTextMakeEmpty(); })
        .then(function () { counter++; return testShareNote(); }) // TODO: broken
        .then(function () { counter++; return testAutoSuggest(); })
        .then(function () { counter++; return testTextAreaSize(); })
        .then(function () { counter++; return testNoteLoadingOrder(); })

        .then(function () {
            var after = new Date();
            reportInfo('Total tests: ' + counter + '. Time elapsed: ' + (after.getTime() - before.getTime()));

            return reportSuccess('*** ALL TESTS PASSED ***');
        })
        .catch(function (err) { reportError('*** TESTS FAILED ***'); });
}

// Util

function getUniqueTimestamp() {
    return Math.floor(Math.random() * 1000 + 36).toString(36) + new Date().getTime().toString(36);
}

function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms) });
}

// Reporting functions

function startTest(name) {
    $('#diag_log').append('<div class="msg">STARTED: ' + name + '</div>');

    return Promise.resolve();
}

function reportError(error) {
    $('#diag_log').append('<div class="error">ERROR: ' + error + '</div>');

    return Promise.resolve();
}

function reportSuccess(name) {
    $('#diag_log').append('<div class="success">SUCCESS: ' + name + '</div>');

    return Promise.resolve();
}

function reportInfo(info) {
    $('#diag_log').append('<div class="msg">' + info + '</div>');

    return Promise.resolve();
}

// Helpers

function createNewNote(title) {
    var templateTitle = $('.template-note .note-title');
    if (!templateTitle.length) {
        throw 'template title not found';
    }

    templateTitle.val(title);
    templateTitle.blur();

    return delay(ShortDelay);
}

function setNoteText(title, text) {
    var note = getNoteByTitle(title);

    note.find('.note-button-edit').click();
    note.find('textarea.note-text-editable').val(text);
    note.find('.note-button-save').click();

    return delay(ShortDelay);
}

function setNoteTextNoControlButtons(title, text) {
    var note = getNoteByTitle(title);

    note.find('.note-text').click();
    note.find('textarea.note-text-editable').val(text);
    note.click();

    return delay(ShortDelay);
}

function setTemplateNoteTextAndCancel(text) {
    var templateNote = $('.note-outer.template-note');

    templateNote.find('.note-text').click();
    templateNote.find('textarea.note-text-editable').val(text);
    templateNote.find('.note-button-cancel').click();

    return delay(ShortDelay);
}

function setNoteTextAndCancel(title, text) {
    var note = getNoteByTitle(title);

    note.find('.note-button-edit').click();
    note.find('textarea.note-text-editable').val(text);
    note.find('.note-button-cancel').click();

    return delay(ShortDelay);
}

function setNoteTitle(oldTitle, newTitle) {
    var note = getNoteByTitle(oldTitle);

    var titleElement = note.find('.note-title');
    if (!titleElement.length) {
        throw 'Title element not found';
    }

    titleElement.val(newTitle);
    titleElement.blur();

    return delay(ShortDelay);
}

function deleteNote(title) {
    var note = getNoteByTitle(title);

    note.find('.note-button-delete').click();

    return delay(ShortDelay);
}

function undoNoteDelete(title) {
    var note = getDeletedNoteByTitle(title);

    note.find('.note-button-restore').click();

    return delay(ShortDelay);
}

function deleteAllVisibleNotes() {
    var allNotes = $('.note-outer:not(.template-note):not(.deleted-note)');
    allNotes.each(function () {
        $(this).find('.note-button-delete').click();
    });

    return delay(ShortDelay);
}

function deleteFirstVisibleNote() {
    var allNotes = $('.note-outer:not(.template-note):not(.deleted-note)');
    $(allNotes[0]).find('.note-button-delete').click();

    return delay(ShortDelay);
}

function shareNote(title) {
    var note = getNoteByTitle(title);

    note.find('.note-button-share').click();

    return delay(ShortDelay);
}

function search(text) {
    var searchTextbox = $('#search_textbox');

    searchTextbox.val(text);

    var e = $.Event('keyup');
    e.keyCode = 13;
    searchTextbox.trigger(e);

    return delay(MediumDelay);
}

function resetUI() {
    return search(getUniqueTimestamp());
}

function getNoteByTitle(title) {
    var allNotes = $('.note-outer:not(.template-note):not(.deleted-note)');

    var note = null;
    allNotes.each(function () {
        if ($(this).find('input.note-title').val() === title) {
            note = $(this);
            return false;
        }
    });

    if (!note) {
        throw 'Note with title [' + title + '] was not found';
    }

    return note;
}

function getDeletedNoteByTitle(title) {
    var allNotes = $('.note-outer.deleted-note');

    var note = null;
    allNotes.each(function () {
        if ($(this).find('del div.note-title').text() === title) {
            note = $(this);
            return false;
        }
    });

    if (!note) {
        throw 'Deleted note with title [' + title + '] was not found';
    }

    return note;
}

function getMoreButton() {
    var moreButton = $('#more_button');

    if (!moreButton.length) {
        throw '"More" button was not found';
    }
    if (moreButton.length > 1) {
        throw 'More than one "More" button found';
    }

    return moreButton;
}

function clickMoreButton() {
    var moreButton = getMoreButton();
    moreButton.click();

    return delay(LongDelay);
}

function checkNoteVisible(title, html) {
    var note = getNoteByTitle(title);

    var actualHtml = note.find('.note-text').html();
    if (actualHtml !== html) {
        throw 'Note [' + title + '] has wrong content. Expected: [' + html + '], actual: [' + actualHtml + ']';
    }

    return Promise.resolve();
}

function checkNoteNotVisible(title, html) {
    try {
        var note = getNoteByTitle(title);
    }
    catch (err) {
        return Promise.resolve();
    }

    throw 'Note with title [' + title + '] was found';
}

function checkNoteShareLink(title, linkText) {
    var note = getNoteByTitle(title);

    var actualLinkText = note.find('.note-share-link').val();
    if (actualLinkText.indexOf(linkText) === -1) {
        throw 'Note [' + title + '] share link does not contain expected value. Expected substring: [' + linkText + '], actual link: [' + actualLinkText + ']';
    }

    return Promise.resolve();
}

function checkTemplateNoteExists(placeholder, html) {
    var note = $('.note-outer.template-note');
    if (!note.length) {
        throw 'Template note not found';
    }
    if (note.length > 1) {
        throw 'More than one template note found';
    }

    var actualPlaceholder = note.find('input.note-title').attr("placeholder");
    if (actualPlaceholder !== placeholder) {
        throw 'Template placeholder is wrong. Expected: [' + placeholder + '], actual: [' + actualPlaceholder + ']';
    }

    var actualTitle = note.find('input.note-title').val();
    if (actualTitle !== '') {
        throw 'Template note has wrong title. Expected: empty, actual: [' + actualTitle + ']';
    }

    var actualHtml = note.find('.note-text').html();
    if (actualHtml !== html) {
        throw 'Template note has wrong content. Expected: [' + html + '], actual: [' + actualHtml + ']';
    }

    var controlArea = note.find('.note-controlarea').val();
    if (controlArea.length) {
        throw "Template note should not have a control area visible in 'view' mode";
    }

    return Promise.resolve();
}

function checkVisibleNotesCount(expected) {
    var allNotes = $('.note-outer:not(.template-note):not(.deleted-note)');
    if (allNotes.length !== expected) {
        throw 'Note count is incorrect. Expected count: ' + expected + ', actual count: ' + allNotes.length + '.';
    }

    return Promise.resolve();
}

function checkMoreButtonVisible(expectedCount) {
    var moreButton = getMoreButton();

    var actualCount = moreButton.find('.more-button-count').text();
    if (actualCount !== expectedCount.toString()) {
        throw '"More" button count is incorrect. Expected count: ' + expectedCount + ', actual count: ' + actualCount + '.';
    }

    return Promise.resolve();
}

function checkMoreButtonNotVisible() {
    try {
        var moreButton = getMoreButton();
    }
    catch (err) {
        return Promise.resolve();
    }

    throw '"More" button was found';
}

function checkBothNotesVisible(title, html1, html2) {
    var allNotes = $('.note-outer:not(.template-note):not(.deleted-note)');

    var found1 = false;
    var found2 = false;
    allNotes.each(function () {
        if ($(this).find('input.note-title').val() === title) {
            if ($(this).find('.note-text').html() === html1) {
                if (found1) {
                    throw 'Note with title [' + title + '] and content [' + html1 + '[ was already found.';
                }

                found1 = true;
            }
            if ($(this).find('.note-text').html() === html2) {
                if (found2) {
                    throw 'Note with title [' + title + '] and content [' + html2 + '[ was already found.';
                }

                found2 = true;
            }
        }
    });

    if (!found1) {
        throw 'Note with title [' + title + '] and content [' + html1 + '[ was not found.';
    }
    if (!found1) {
        throw 'Note with title [' + title + '] and content [' + html2 + '[ was not found.';
    }

    return Promise.resolve();
}

function checkAutoCompleteSuggestions(expectedSuggestions) {
    var autoCompleteElement = $('div:not([style*="display: none"]).autocomplete-suggestions');
    if (!autoCompleteElement.length) {
        throw 'Auto-complete was not found';
    }
    if (autoCompleteElement.length > 1) {
        throw 'More than one auto-complete found';
    }

    var found = {};
    for (var j = 0, len1 = expectedSuggestions.length; j < len1; j++) {
        found[expectedSuggestions[j]] = 0;
    }

    var actualSuggestions = autoCompleteElement.find('.autocomplete-suggestion');
    for (var i = 0, len = actualSuggestions.length; i < len; i++) {
        for (var j = 0, len1 = expectedSuggestions.length; j < len1; j++) {
            if (actualSuggestions[i].innerText === expectedSuggestions[j]) {
                found[expectedSuggestions[j]]++;
            }
        }
    }

    for (var j = 0, len1 = expectedSuggestions.length; j < len1; j++) {
        if (!found[expectedSuggestions[j]]) {
            throw 'Auto-suggestion is incorrect. Tag missing: [' + expectedSuggestions[j] + '].';
        }
        if (found[expectedSuggestions[j]] > 1) {
            throw 'Auto-suggestion is incorrect. Tag found twice: [' + expectedSuggestions[j] + '].';
        }
    }
}

function typeIntoTemplateTitle(text) {
    var templateTitle = $('.template-note .note-title');
    if (!templateTitle.length) {
        throw 'template title not found';
    }

    templateTitle.val(templateTitle.val() + text);
    templateTitle.focus();

    return delay(ShortDelay);
}

function checkEditingAreaClass(title, expectedClass) {
    var note = getNoteByTitle(title);
    note.find('.note-button-edit').click();
    var textArea = note.find('textarea.note-text-editable');

    if (!textArea.hasClass(expectedClass)) {
        throw 'Text area is expected to have class [' + expectedClass + '].';
    }
}

function checkNotesOrder(titles) {
    var allNotes = $('.note-outer:not(.template-note):not(.deleted-note)');

    if (allNotes.length !== titles.length) {
        throw 'Expected ' + titles.length + 'notes, found ' + allNotes.length + 'notes';
    }

    for (var i = 0, len = allNotes.length; i < len; i++) {
        var expectedTitle = titles[i];
        var actualTitle = $(allNotes[i]).find('input.note-title').val();

        if (expectedTitle !== actualTitle) {
            throw 'Expected note [' + expectedTitle + '] , found: [' + actualTitle + ']';
        }
    }
}

// Tests

function testCreateNewNote() {
    var name = "Create 3 notes with simple text";

    var testId = getUniqueTimestamp();

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'First note';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Second note';
    var note03Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Third note';

    return startTest(name)
        // Act
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return setNoteText(note01Title, 'Note One'); })
        .then(function () { return createNewNote(note02Title); })
        // Alternative way of editing
        .then(function () { return setNoteTextNoControlButtons(note02Title, 'Note Two'); })
        .then(function () { return createNewNote(note03Title); })
        .then(function () { return setNoteText(note03Title, 'Note Three'); })
        .then(function () { return resetUI(); })
        // Verify
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(note01Title, 'Note One\n'); })
        .then(function () { return checkNoteVisible(note02Title, 'Note Two\n'); })
        .then(function () { return checkNoteVisible(note03Title, 'Note Three\n'); })
        .then(function () { return checkMoreButtonNotVisible(); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testCreateNewNoteSpecial() {
    var name = "Create new note - special cases";

    var testId = getUniqueTimestamp();

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Special chars /?<>\\:*|\"^';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Unicode: моя запись';
    var note03Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Script <script>alert("hacked")</script>';

    return startTest(name)
        // Act
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return setNoteText(note01Title, 'Special chars /?<>\\:*|\"^ in the text'); })
        .then(function () { return createNewNote(note02Title); })
        .then(function () { return setNoteText(note02Title, 'Unicode: мой текст'); })
        .then(function () { return createNewNote(note03Title); })
        .then(function () { return setNoteText(note03Title, 'Script: <script>alert("You have been hacked")</script>'); })
        .then(function () { return resetUI(); })
        // Verify
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(note01Title, 'Special chars /?&lt;&gt;\\:*|\"^ in the text\n'); })
        .then(function () { return checkNoteVisible(note02Title, 'Unicode: мой текст\n'); })
        .then(function () { return checkNoteVisible(note03Title, 'Script: &lt;script&gt;alert("You have been hacked")&lt;/script&gt;\n'); })
        .then(function () { return checkMoreButtonNotVisible(); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testTemplateNote() {
    var name = "Use template note";

    var testId = getUniqueTimestamp();

    var templateNotePlaceholderExpected = 'New note';
    var templateNoteTextExpected = '<span class="placeholder">Type your text here</span>';

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'First note';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Second note';

    return startTest(name)
        // Act - Verify
        .then(function () { return checkTemplateNoteExists(templateNotePlaceholderExpected, templateNoteTextExpected); })
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return checkTemplateNoteExists(templateNotePlaceholderExpected, templateNoteTextExpected); })
        .then(function () { return createNewNote(note02Title); })
        .then(function () { return checkTemplateNoteExists(templateNotePlaceholderExpected, templateNoteTextExpected); })
        .then(function () { return resetUI(); })
        .then(function () { return checkTemplateNoteExists(templateNotePlaceholderExpected, templateNoteTextExpected); })
        .then(function () { return search(testId); })
        .then(function () { return checkTemplateNoteExists(templateNotePlaceholderExpected, templateNoteTextExpected); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testEditNoteText() {
    var name = "Edit note text";

    var testId = getUniqueTimestamp();

    var noteTitle = testId + ' ' + getUniqueTimestamp() + ' ' + 'Test note';

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(noteTitle); })
        .then(function () { return setNoteText(noteTitle, 'Initial text'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, 'Initial text\n'); })
        .then(function () { return setNoteText(noteTitle, 'Updated text'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, 'Updated text\n'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testCancelEditingNoteText() {
    var name = "Cancel note text editing";

    var testId = getUniqueTimestamp();

    var noteTitle = testId + ' ' + getUniqueTimestamp() + ' ' + 'Test note';

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(noteTitle); })
        .then(function () { return setNoteText(noteTitle, 'Initial text'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, 'Initial text\n'); })
        .then(function () { return setNoteTextAndCancel(noteTitle, 'Updated text'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, 'Initial text\n'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testCancelTemplateNoteEditing() {
    var name = "Cancel template note editing";

    return startTest(name)
        // Act - Verify
        .then(function () { return setTemplateNoteTextAndCancel('Some text'); })

        .then(function () { return resetUI(); })
        .then(function () { return search(''); })
        .then(function () { return checkVisibleNotesCount(0); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testEditNoteTitle() {
    var name = "Edit note title";

    var testId = getUniqueTimestamp();

    var noteId = getUniqueTimestamp();
    var noteTitle1 = testId + ' ' + noteId + ' ' + 'Test note title';
    var noteTitle2 = testId + ' ' + noteId + ' ' + 'Test note title updated';

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(noteTitle1); })
        .then(function () { return setNoteText(noteTitle1, 'Some text'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle1, 'Some text\n'); })
        .then(function () { return setNoteTitle(noteTitle1, noteTitle2); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteNotVisible(noteTitle1, 'Some text\n'); })
        .then(function () { return checkNoteVisible(noteTitle2, 'Some text\n'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testBasicFormatting() {
    var name = "Basic formatting";

    var testId = getUniqueTimestamp();

    var noteTitle = testId + ' ' + getUniqueTimestamp() + ' ' + 'Formatted note';

    return startTest(name)
        // Act
        .then(function () { return createNewNote(noteTitle); })
        .then(function () { return setNoteText(noteTitle, 'This is an *important* note. _Very_ important.'); })
        .then(function () { return resetUI(); })
        // Verify
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, 'This is an <b>important</b> note. <i>Very</i> important.\n'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testDeleteNote() {
    var name = "Delete note";

    var testId = getUniqueTimestamp();

    var noteTitle = testId + ' ' + getUniqueTimestamp() + ' ' + 'Test note';

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(noteTitle); })
        .then(function () { return setNoteText(noteTitle, 'Note text'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, 'Note text\n'); })
        .then(function () { return deleteNote(noteTitle); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteNotVisible(noteTitle, 'Note text\n'); })
        // Cleanup
        // No cleanup needed
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testUndoDeleteNote() {
    var name = "Undo delete note";

    var testId = getUniqueTimestamp();

    var noteTitle = testId + ' ' + getUniqueTimestamp() + ' ' + 'Test note';

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(noteTitle); })
        .then(function () { return setNoteText(noteTitle, 'Note text'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return deleteNote(noteTitle); })
        .then(function () { return undoNoteDelete(noteTitle); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, 'Note text\n'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testSearch() {
    var name = "Search";

    var testId = getUniqueTimestamp();

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + '#one Alpha Beta Gamma';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Beta #two Gamma';
    var note03Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Gamma #three';

    return startTest(name)
        // Act
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return setNoteText(note01Title, 'Note One'); })
        .then(function () { return createNewNote(note02Title); })
        .then(function () { return setNoteText(note02Title, 'Note Two'); })
        .then(function () { return createNewNote(note03Title); })
        .then(function () { return setNoteText(note03Title, 'Note Three'); })
        .then(function () { return resetUI(); })
        // Verify by tag 1
        .then(function () { return search('#one'); })
        .then(function () { return checkNoteVisible(note01Title, 'Note One\n'); })
        .then(function () { return checkNoteNotVisible(note02Title, 'Note Two\n'); })
        .then(function () { return checkNoteNotVisible(note03Title, 'Note Three\n'); })
        .then(function () { return resetUI(); })
        // Verify by tag 2
        .then(function () { return search('#two'); })
        .then(function () { return checkNoteNotVisible(note01Title, 'Note One\n'); })
        .then(function () { return checkNoteVisible(note02Title, 'Note Two\n'); })
        .then(function () { return checkNoteNotVisible(note03Title, 'Note Three\n'); })
        .then(function () { return resetUI(); })
        // Verify by tag 3
        .then(function () { return search('#three'); })
        .then(function () { return checkNoteNotVisible(note01Title, 'Note One\n'); })
        .then(function () { return checkNoteNotVisible(note02Title, 'Note Two\n'); })
        .then(function () { return checkNoteVisible(note03Title, 'Note Three\n'); })
        .then(function () { return resetUI(); })
        // Verify by keyword 1
        .then(function () { return search('alpha'); })
        .then(function () { return checkNoteVisible(note01Title, 'Note One\n'); })
        .then(function () { return checkNoteNotVisible(note02Title, 'Note Two\n'); })
        .then(function () { return checkNoteNotVisible(note03Title, 'Note Three\n'); })
        .then(function () { return resetUI(); })
        // Verify by keyword 2
        .then(function () { return search('beta'); })
        .then(function () { return checkNoteVisible(note01Title, 'Note One\n'); })
        .then(function () { return checkNoteVisible(note02Title, 'Note Two\n'); })
        .then(function () { return checkNoteNotVisible(note03Title, 'Note Three\n'); })
        .then(function () { return resetUI(); })
        // Verify by keyword 3
        .then(function () { return search('gamma'); })
        .then(function () { return checkNoteVisible(note01Title, 'Note One\n'); })
        .then(function () { return checkNoteVisible(note02Title, 'Note Two\n'); })
        .then(function () { return checkNoteVisible(note03Title, 'Note Three\n'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testLoadNotesInBatches() {
    var name = "Load notes in batches";

    var testId = getUniqueTimestamp();

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 1';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 2';
    var note03Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 3';
    var note04Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 4';
    var note05Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 5';
    var note06Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 6';
    var note07Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 7';
    var note08Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 8';

    return startTest(name)
        // Act
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return setNoteText(note01Title, 'Note One'); })
        .then(function () { return createNewNote(note02Title); })
        .then(function () { return setNoteText(note02Title, 'Note Two'); })
        .then(function () { return createNewNote(note03Title); })
        .then(function () { return setNoteText(note03Title, 'Note Three'); })
        .then(function () { return createNewNote(note04Title); })
        .then(function () { return setNoteText(note04Title, 'Note Four'); })
        .then(function () { return createNewNote(note05Title); })
        .then(function () { return setNoteText(note05Title, 'Note Five'); })
        .then(function () { return createNewNote(note06Title); })
        .then(function () { return setNoteText(note06Title, 'Note Six'); })
        .then(function () { return createNewNote(note07Title); })
        .then(function () { return setNoteText(note07Title, 'Note Seven'); })
        .then(function () { return createNewNote(note08Title); })
        .then(function () { return setNoteText(note08Title, 'Note Eight'); })
        .then(function () { return resetUI(); })
        // Verify
        .then(function () { return search(testId); })
        .then(function () { return checkVisibleNotesCount(5); })
        .then(function () { return checkMoreButtonVisible(3); })
        .then(function () { return clickMoreButton(); })
        .then(function () { return checkVisibleNotesCount(8); })
        .then(function () { return checkMoreButtonNotVisible(); })
        .then(function () { return checkNoteVisible(note01Title, 'Note One\n'); })
        .then(function () { return checkNoteVisible(note02Title, 'Note Two\n'); })
        .then(function () { return checkNoteVisible(note03Title, 'Note Three\n'); })
        .then(function () { return checkNoteVisible(note04Title, 'Note Four\n'); })
        .then(function () { return checkNoteVisible(note05Title, 'Note Five\n'); })
        .then(function () { return checkNoteVisible(note06Title, 'Note Six\n'); })
        .then(function () { return checkNoteVisible(note07Title, 'Note Seven\n'); })
        .then(function () { return checkNoteVisible(note08Title, 'Note Eight\n'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testEditNoteMakeTitlesTheSame() {
    var name = "Make 2 notes with the same title";

    var testId = getUniqueTimestamp();

    var noteId = getUniqueTimestamp();
    var noteTitle1 = testId + ' ' + noteId + ' ' + 'Note A';
    var noteTitle2 = testId + ' ' + noteId + ' ' + 'Note B';

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(noteTitle1); })
        .then(function () { return setNoteText(noteTitle1, 'Note One'); })
        .then(function () { return createNewNote(noteTitle2); })
        .then(function () { return setNoteText(noteTitle2, 'Note Two'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return setNoteTitle(noteTitle2, noteTitle1); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkBothNotesVisible(noteTitle1, 'Note One\n', 'Note Two\n'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testLoadOneMoreNote() {
    var name = "Load one more note after delete";

    var testId = getUniqueTimestamp();

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 1';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 2';
    var note03Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 3';
    var note04Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 4';
    var note05Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 5';
    var note06Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 6';
    var note07Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 7';
    var note08Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Note 8';

    return startTest(name)
        // Act
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return setNoteText(note01Title, 'Note One'); })
        .then(function () { return createNewNote(note02Title); })
        .then(function () { return setNoteText(note02Title, 'Note Two'); })
        .then(function () { return createNewNote(note03Title); })
        .then(function () { return setNoteText(note03Title, 'Note Three'); })
        .then(function () { return createNewNote(note04Title); })
        .then(function () { return setNoteText(note04Title, 'Note Four'); })
        .then(function () { return createNewNote(note05Title); })
        .then(function () { return setNoteText(note05Title, 'Note Five'); })
        .then(function () { return createNewNote(note06Title); })
        .then(function () { return setNoteText(note06Title, 'Note Six'); })
        .then(function () { return createNewNote(note07Title); })
        .then(function () { return setNoteText(note07Title, 'Note Seven'); })
        .then(function () { return createNewNote(note08Title); })
        .then(function () { return setNoteText(note08Title, 'Note Eight'); })
        .then(function () { return resetUI(); })
        // Verify
        .then(function () { return search(testId); })
        .then(function () { return checkVisibleNotesCount(5); })
        .then(function () { return checkMoreButtonVisible(3); })

        .then(function () { return deleteFirstVisibleNote(); })
        .then(function () { return checkVisibleNotesCount(5); })
        .then(function () { return checkMoreButtonVisible(2); })

        .then(function () { return deleteFirstVisibleNote(); })
        .then(function () { return checkVisibleNotesCount(5); })
        .then(function () { return checkMoreButtonVisible(1); })

        .then(function () { return deleteFirstVisibleNote(); })
        .then(function () { return checkVisibleNotesCount(5); })
        .then(function () { return checkMoreButtonNotVisible(); })

        .then(function () { return deleteFirstVisibleNote(); })
        .then(function () { return checkVisibleNotesCount(4); })
        .then(function () { return checkMoreButtonNotVisible(); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testEditNoteTextMakeEmpty() {
    var name = "Edit note text - make empty";

    var testId = getUniqueTimestamp();

    var noteTitle = testId + ' ' + getUniqueTimestamp() + ' ' + 'Test note';

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(noteTitle); })
        .then(function () { return setNoteText(noteTitle, 'Initial text'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, 'Initial text\n'); })
        .then(function () { return setNoteText(noteTitle, ''); })
        .then(function () { return checkNoteVisible(noteTitle, '<span class="placeholder">Type your text here</span>'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNoteVisible(noteTitle, '<span class="placeholder">Type your text here</span>'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testShareNote() {
    var name = "Share note";

    var testId = getUniqueTimestamp();

    var noteTitle = testId + ' ' + getUniqueTimestamp() + ' ' + 'Test note';

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(noteTitle); })
        .then(function () { return setNoteText(noteTitle, 'Note text'); })
        .then(function () { return shareNote(noteTitle); })
        .then(function () { return checkNoteShareLink(noteTitle, 'Test%20note.txt'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testAutoSuggest() {
    var name = "Auto-suggest";

    var testId = getUniqueTimestamp();

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + '#tagone';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + '#tagone #tagtwo';
    var note03Title = testId + ' ' + getUniqueTimestamp() + ' ' + '#tagone #tagtwo #tagthree';
    var note04Title = testId + ' ' + getUniqueTimestamp();

    return startTest(name)
        // Act - Verify
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return typeIntoTemplateTitle('#'); })
        .then(function () { return checkAutoCompleteSuggestions(['#tagone']); })
        .then(function () { return createNewNote(note02Title); })
        .then(function () { return typeIntoTemplateTitle('#'); })
        .then(function () { return checkAutoCompleteSuggestions(['#tagone', '#tagtwo']); })
        .then(function () { return createNewNote(note03Title); })
        .then(function () { return typeIntoTemplateTitle('#'); })
        .then(function () { return checkAutoCompleteSuggestions(['#tagone', '#tagtwo', '#tagthree']); })
        .then(function () { return createNewNote(note04Title); }) // This is to blur the focus from the auto-suggest
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testTextAreaSize() {
    var name = "Text area adaptive size";

    var testId = getUniqueTimestamp();

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'First note';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Second note';

    return startTest(name)
        // Act
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return setNoteText(note01Title, 'Note One'); })
        .then(function () { return createNewNote(note02Title); })
        .then(function () { return setNoteText(note02Title, '\n\n\n\n\n\n\n\n\n\n'); })
        .then(function () { return resetUI(); })
        // Verify
        .then(function () { return search(testId); })
        .then(function () { return checkEditingAreaClass(note01Title, 'text-area-short'); })
        .then(function () { return checkEditingAreaClass(note02Title, 'text-area-tall'); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

function testNoteLoadingOrder() {
    var name = "Note loading order";

    var testId = getUniqueTimestamp();

    var note01Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'First note';
    var note02Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Second note';
    var note03Title = testId + ' ' + getUniqueTimestamp() + ' ' + 'Third note';

    return startTest(name)
        // Act
        .then(function () { return createNewNote(note01Title); })
        .then(function () { return setNoteText(note01Title, 'Note One'); })
        .then(function () { return createNewNote(note02Title); })
        .then(function () { return setNoteText(note02Title, 'Note Two'); })
        .then(function () { return createNewNote(note03Title); })
        .then(function () { return setNoteText(note03Title, 'Note Three'); })
        .then(function () { return resetUI(); })
        // Verify
        .then(function () { return search(testId); })
        .then(function () { return checkNotesOrder([note03Title, note02Title, note01Title]); })
        .then(function () { return setNoteText(note02Title, 'Note Two upd'); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNotesOrder([note02Title, note03Title, note01Title]); })
        .then(function () { return setNoteTitle(note01Title, note01Title + " upd"); })
        .then(function () { return resetUI(); })
        .then(function () { return search(testId); })
        .then(function () { return checkNotesOrder([note01Title + " upd", note02Title, note03Title]); })
        // Cleanup
        .then(function () { return deleteAllVisibleNotes(); })
        .then(function () { return resetUI(); })
        // Report result
        .then(function () { return reportSuccess(name); })
        .catch(function (err) { reportError(err); throw err; });
}

    // TODO: test restore note with new note already added with the same name
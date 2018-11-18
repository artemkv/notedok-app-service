"use strict";

const $ = require("jquery");
const Formatting = require("./formatting");
const UiStrings = require("./uistrings");
const Util = require("./util");

function htmlEscape(unsafe) {
    let safe = String(unsafe);
    safe = safe.replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return safe;
}

function renderIntro() {
    return "<div id='intro'>" +
        "<div class='intro-notedok'>NotedOK</div>" +
        "  <div class='intro-p'>On the surface,<br>Minimalistic note making web site</div>" +
        "  <div class='intro-p'>Under the hood,<br>Bunch of plain text files in your Dropbox</div>" +
        "  <div class='intro-button-container'>" +
        "    <button id='intro-button' class='intro-button'>Connect NotedOK.com to Dropbox</button>" +
        "  </div>" +
        "  <div class='intro-signature'>©Artem Kondratyev (<a target='_blank' href='http://twitter.com/artem_notedok'>@artem_notedok</a>)</div>" +
        "</div>";
}

function renderNoteTextHtml(text) {
    // replace '[http' with '[rmhttp'
    var urlRegEx = /(\[http)/ig;
    text = text.replace(urlRegEx, "[rmhttp");

    // put link in square brackets
    var urlRegEx = /(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    text = text.replace(urlRegEx, "[$1]");

    // replace '[rmhttp' with '[http'
    var urlRegEx = /(\[rmhttp)/ig;
    text = text.replace(urlRegEx, "[http");

    return Formatting.createWikiToHtmlFormatter().format(text);
}

function renderNoteTitle(note) {
    let placeholder = "";
    if (note.IsTemplate) {
        placeholder = UiStrings.TemplateNoteTitlePlaceholder;
    } else {
        placeholder = UiStrings.NoteTitlePlaceholder;
    }

    return "<input type='text' class='note-title' value='" + htmlEscape(note.Title) + "' placeholder='" + placeholder + "' maxlength='50' />";
}

function renderDeletedNoteTitle(noteTitle) {
    return "<del><div class='note-title'>" + htmlEscape(noteTitle) + "</div></del>";
}

function renderNoteTextReadOnly(note) {
    if (note.Text) {
        return "<div class='note-text' tabindex='0'>" + renderNoteTextHtml(htmlEscape(note.Text)) + "</div>";
    }
    return "<div class='note-text' tabindex='0'>" + "<span class='placeholder'>" + UiStrings.NoteTextPlaceholder + "</span>" + "</div>";
}

function renderNoteTextEditable(note) {
    let textAreaClass;
    if (Util.countLines(note.Text) > 10) {
        textAreaClass = 'text-area-tall'
    } else {
        textAreaClass = 'text-area-short'
    }

    return "<div class='note-text-editable-container'><textarea class='note-text-editable " + textAreaClass + "'>" + htmlEscape(note.Text) + "</textarea><button class='note-save-button'>" + UiStrings.SaveButtonText + "</button></div>";
}

function renderNoteControlArea() {
    return "<div class='note-controlarea'>" +
        "<a href='javascript:void(0);' class='note-button note-button-save'>" + UiStrings.SaveButtonText + "</a>" +
        "<a href='javascript:void(0);' class='note-button note-button-cancel'>" + UiStrings.CancelButtonText + "</a>" +
        "<a href='javascript:void(0);' class='note-button note-button-share'>" + UiStrings.ShareButtonText + "</a>" +
        "<a href='javascript:void(0);' class='note-button note-button-edit'>" + UiStrings.EditButtonText + "</a>" +
        "<a href='javascript:void(0);' class='note-button note-button-delete'>" + UiStrings.DeleteButtonText + "</a></div>";
}

function renderDeletedNoteControlArea() {
    return "<div class='note-controlarea'>" +
        "<a href='javascript:void(0);' class='note-button note-button-restore'>" + UiStrings.RestoreButtonText + "</a></div>";
}

function renderNoteShareLinkContainer() {
    return "<div class='note-share-link-container'></div>";
}

function renderNoteShareLink(link) {
    return "<input class='note-share-link' value='" + link + "'></input>";
}

function renderNote(note) {
    let additionalClasses = "";
    if (note.IsTemplate) {
        additionalClasses += " template-note";
    }

    return "<div id='" + note.Id + "' class='note-outer mode-view" + additionalClasses + "'><div class='note-inner'>" +
        renderNoteTitle(note) +
        renderNoteTextReadOnly(note) +
        renderNoteControlArea() +
        "</div>" + renderNoteShareLinkContainer() + "</div>";
}

function switchModeToEdit(note) {
    getNoteOuterElement(note.Id).removeClass("mode-view");
    getNoteOuterElement(note.Id).addClass("mode-edit");
}

function switchModeToView(note) {
    getNoteOuterElement(note.Id).removeClass("mode-edit");
    getNoteOuterElement(note.Id).addClass("mode-view");
}

function renderDeletedNote(note) {
    return "<div id='" + note.Id + "' class='note-outer deleted-note'><div class='note-inner'>" +
        renderDeletedNoteTitle(note.Title) +
        renderDeletedNoteControlArea() +
        "</div></div>";
}

function renderMoreButton(notesNotYetLoadedTotal) {
    return "<button id='more_button' class='more-button'>" +
        UiStrings.MoreButtonText + " (" +
        "<span id='more_button_count' class='more-button-count'>" +
        notesNotYetLoadedTotal.toString() +
        "</span> " +
        UiStrings.MoreButtonNotLoadedText + ")" +
        "</button>";
}

function getIntro() {
    return $("#intro");
}

function getIntroConnectButton() {
    return $("#intro-button");
}

function getNoteContainer() {
    return $("#note_container");
}

function getNoteAutoCompleteSuggestionsContainer() {
    return $("#note_autocomplete_suggestions_container");
}

function getMoreButtonContainer() {
    return $("#more_button_container");
}

function getMoreButton() {
    return $("#more_button");
}

function getMoreButtonCount() {
    return $("#more_button_count");
}

function getSearchContainer() {
    return $("#search_container");
}

function getSearchAutoCompleteSuggestionsContainer() {
    return $("#search_autocomplete_suggestions_container");
}

function renderSearchPanel() {
    return "<div class='search-panel'><input id='search_textbox' class='search-textbox' placeholder='" +
        UiStrings.SearchTextBoxPlaceholder +
        "' /></div>";
}

function getSearchTextbox() {
    return $("#search_textbox");
}

function getNoteOuterElement(noteId) {
    return $("#" + noteId + ".note-outer");
}

function getNoteTitleElement(noteId) {
    return $("#" + noteId + " .note-title");
}

function getNoteTextElement(noteId) {
    return $("#" + noteId + " .note-text");
}

function getNoteTextEditableContainerElement(noteId) {
    return $("#" + noteId + " .note-text-editable-container");
}

function getNoteTextEditableElement(noteId) {
    return $("#" + noteId + " .note-text-editable");
}

function getNoteShareLinkContainerElement(noteId) {
    return $("#" + noteId + " .note-share-link-container");
}

function getNoteShareLinkElement(noteId) {
    return $("#" + noteId + " .note-share-link");
}

function getAllNoteTitleElements() {
    return $(".note-title");
}

function getNoteEditButton(noteId) {
    return $("#" + noteId + " .note-button-edit");
}

function getNoteDeleteButton(noteId) {
    return $("#" + noteId + " .note-button-delete");
}

function getNoteShareButton(noteId) {
    return $("#" + noteId + " .note-button-share");
}

function getNoteSaveButton(noteId) {
    return $("#" + noteId + " .note-button-save");
}

function getNoteCancelButton(noteId) {
    return $("#" + noteId + " .note-button-cancel");
}

function getNoteRestoreButton(noteId) {
    return $("#" + noteId + " .note-button-restore");
}

function getDeletedNotes() {
    return $(".deleted-note.note-outer");
}

function convertTitleToRegularNoteTitle(note) {
    getNoteTitleElement(note.Id).attr("placeholder", UiStrings.NoteTitlePlaceholder);
}

function renderProgressIndicator() {
    return "<div class='spinner'>" +
        "  <div class='spinner-container container1' > " +
        "    <div class='circle1'></div>" +
        "    <div class='circle2'></div>" +
        "    <div class='circle3'></div>" +
        "    <div class='circle4'></div>" +
        "  </div>" +
        "  <div class='spinner-container container2'>" +
        "    <div class='circle1'></div>" +
        "    <div class='circle2'></div>" +
        "    <div class='circle3'></div>" +
        "    <div class='circle4'></div>" +
        "  </div>" +
        "  <div class='spinner-container container3'>" +
        "    <div class='circle1'></div>" +
        "    <div class='circle2'></div>" +
        "    <div class='circle3'></div>" +
        "    <div class='circle4'></div>" +
        "  </div>" +
        "</div>";
}

function getProgressIndicator() {
    return $(".spinner");
}

function renderSharedNote(noteTitle, noteText) {
    document.title = noteTitle;

    let noteHtml = "<div class='note-outer'><div class='note-inner'>" +
        renderSharedNoteTitle(noteTitle) +
        renderSharedNoteText(noteText) +
        "</div><div class='note-share-link-container'></br></div></div>";

    $("#note_container").prepend(noteHtml);
}

function renderSharedNoteTitle(noteTitle) {
    return "<div class='note-title'>" + noteTitle + "</div>";
}

function renderSharedNoteText(noteText) {
    return "<div class='note-text'>" + renderNoteTextHtml(htmlEscape(noteText)) + "</div>";
}

// Module
const ui = {
    htmlEscape: htmlEscape,
    renderIntro: renderIntro,
    renderNote: renderNote,
    renderNoteTitle: renderNoteTitle,
    renderDeletedNoteTitle: renderDeletedNoteTitle,
    renderNoteTextReadOnly: renderNoteTextReadOnly,
    renderNoteTextEditable: renderNoteTextEditable,
    renderNoteTextHtml: renderNoteTextHtml,
    renderNoteControlArea: renderNoteControlArea,
    renderDeletedNoteControlArea: renderDeletedNoteControlArea,
    renderNoteShareLinkContainer: renderNoteShareLinkContainer,
    renderNoteShareLink: renderNoteShareLink,
    renderDeletedNote: renderDeletedNote,
    renderMoreButton: renderMoreButton,
    renderSearchPanel: renderSearchPanel,
    convertTitleToRegularNoteTitle: convertTitleToRegularNoteTitle,
    renderProgressIndicator: renderProgressIndicator,
    renderSharedNote: renderSharedNote,
    renderSharedNoteTitle: renderSharedNoteTitle,
    renderSharedNoteText: renderSharedNoteText,
    switchModeToEdit: switchModeToEdit,
    switchModeToView: switchModeToView,

    getIntro: getIntro,
    getIntroConnectButton: getIntroConnectButton,
    getMoreButtonContainer: getMoreButtonContainer,
    getMoreButton: getMoreButton,
    getMoreButtonCount: getMoreButtonCount,
    getSearchContainer: getSearchContainer,
    getSearchAutoCompleteSuggestionsContainer: getSearchAutoCompleteSuggestionsContainer,
    getSearchTextbox: getSearchTextbox,
    getNoteContainer: getNoteContainer,
    getNoteAutoCompleteSuggestionsContainer: getNoteAutoCompleteSuggestionsContainer,
    getNoteOuterElement: getNoteOuterElement,
    getNoteTitleElement: getNoteTitleElement,
    getNoteTextElement: getNoteTextElement,
    getNoteTextEditableContainerElement: getNoteTextEditableContainerElement,
    getNoteTextEditableElement: getNoteTextEditableElement,
    getNoteShareLinkContainerElement: getNoteShareLinkContainerElement,
    getNoteShareLinkElement: getNoteShareLinkElement,
    getAllNoteTitleElements: getAllNoteTitleElements,
    getNoteEditButton: getNoteEditButton,
    getNoteDeleteButton: getNoteDeleteButton,
    getNoteShareButton: getNoteShareButton,
    getNoteSaveButton: getNoteSaveButton,
    getNoteCancelButton: getNoteCancelButton,
    getNoteRestoreButton: getNoteRestoreButton,
    getDeletedNotes: getDeletedNotes,
    getProgressIndicator: getProgressIndicator
};

module.exports = ui;
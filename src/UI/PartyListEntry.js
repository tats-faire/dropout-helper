export default class PartyListEntry {
    /** @type {HTMLElement} */ main;
    /** @type {HTMLElement} */ titleElement;
    /** @type {HTMLElement} */ titleElement;
    /** @type {string} */ title;

    constructor(title) {
    }

    create() {
        this.main = document.createElement('div');
        this.main.classList.add('party-list-entry', 'border-bottom', 'site-border-color');

    }
}

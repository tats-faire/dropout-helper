import WatchPartyHost from "../WatchParty/WatchPartyHost.js";
import WatchPartyMember from "../WatchParty/WatchPartyMember.js";

export default class WatchPartySection {
    /** @type {Player} */ player;
    /** @type {boolean} */ busy = false;
    /** @type {HTMLElement} */ main;
    /** @type {HTMLElement} */ message;
    /** @type {HTMLButtonElement} */ createButton;
    /** @type {HTMLButtonElement} */ leaveButton;
    /** @type {HTMLButtonElement} */ copyLinkButton;
    /** @type {?WatchPartyMember} */ member = null;
    /** @type {?WatchPartyHost} */ host = null;

    /**
     * @param {Player} player
     */
    constructor(player) {
        this.player = player;
        this.create();
    }

    updateButtons() {
        let inParty = this.member !== null || this.host !== null;
        this.createButton.style.display = inParty ? 'none' : '';
        this.leaveButton.style.display = inParty ? '' : 'none';
        this.copyLinkButton.style.display = inParty ? '' : 'none';
    }

    create() {
        this.main = document.createElement('div');
        this.main.classList.add('contain', 'padding-vertical-medium', 'padding-horizontal-large');

        let heading = document.createElement('h5');
        heading.classList.add('margin-top-large', 'padding-bottom-medium', 'text-center', 'border-bottom', 'site-border-color', 'site-font-secondary-color');
        heading.textContent = 'Watch Party';
        this.main.appendChild(heading);

        let content = document.createElement('div');
        content.classList.add('text-center', 'margin-top-medium', 'margin-bottom-large');
        this.main.appendChild(content);

        this.message = document.createElement('p');
        this.message.classList.add('site-font-secondary-color');
        this.message.textContent = '';
        this.message.style.display = 'none';
        content.appendChild(this.message);

        this.createButton = this.createButtonElement('Create Watch Party', this.handleCreateButton.bind(this));
        content.appendChild(this.createButton);

        this.leaveButton = this.createButtonElement('Leave Watch Party', this.handleLeaveButton.bind(this));
        this.leaveButton.style.display = 'none';
        content.appendChild(this.leaveButton);

        this.copyLinkButton = this.createButtonElement('Copy Link', this.handleCopyLinkButton.bind(this));
        this.copyLinkButton.style.display = 'none';
        content.appendChild(this.copyLinkButton);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async join(id) {
        if (this.busy) {
            return;
        }
        this.busy = true;
        this.member = new WatchPartyMember(id, this.player);
        try {
            await this.member.init();
        } catch (e) {
            console.error('Failed to join watch party', e);
            this.message.textContent = 'Failed to join watch party. The party may no longer exist or your link may be invalid.';
            this.message.style.display = '';
            this.member = null;
        }
        this.updateButtons();
        this.busy = false;
    }

    /**
     * @param {string} label
     * @param {Function} listener
     * @returns {HTMLButtonElement}
     */
    createButtonElement(label, listener) {
        let button = document.createElement('button');
        button.classList.add('btn', 'btn-transparent', 'custom-btn-action-my-list', 'margin-bottom-small', 'margin-right-small');
        button.textContent = label;
        button.title = label;
        button.addEventListener('click', listener);
        return button;
    }

    /**
     * @returns {Promise<void>}
     */
    async handleCreateButton() {
        if (this.busy) {
            return;
        }
        this.busy = true;
        this.host = new WatchPartyHost(this.player);
        try {
            await this.host.init();
            self.location.hash = '#dhparty-' + this.host.id;
        } catch (e) {
            console.error('Failed to create watch party', e);
            this.message.textContent = 'Failed to create watch party';
            this.message.style.display = '';
            this.host = null;
        }
        this.updateButtons();
        this.busy = false;
    }

    /**
     * @returns {Promise<void>}
     */
    async handleLeaveButton() {
        if (this.busy) {
            return;
        }
        this.busy = true;
        try {
            await this.member?.destroy();
            await this.host?.destroy();
            this.member = null;
            this.host = null;
        } catch (e) {
            console.error('Failed to leave watch party', e);
            this.message.textContent = 'Failed to leave watch party';
            this.message.style.display = '';
        }
        if (self.location.hash.startsWith('#dhparty-')) {
            self.location.hash = '';
        }
        this.updateButtons();
        this.busy = false;
    }

    /**
     * @returns {Promise<void>}
     */
    async handleCopyLinkButton() {
        let id = this.host?.id ?? this.member?.id;
        let url = new URL(window.location.href);
        url.hash = '#dhparty-' + id;
        await navigator.clipboard.writeText(url.href);
        this.copyLinkButton.textContent = 'Copied!';
        setTimeout(() => {
            this.copyLinkButton.textContent = 'Copy Link';
        }, 1000);
    }

    /**
     * @returns {HTMLElement}
     */
    getHtml() {
        return this.main;
    }
}

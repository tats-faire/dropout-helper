import WatchPartyHost from "../WatchParty/WatchPartyHost.js";
import WatchPartyMember from "../WatchParty/WatchPartyMember.js";

export default class WatchPartySection {
    /** @type {Player} */ player;
    /** @type {import("../Storage.js").default} */ storage;
    /** @type {boolean} */ busy = false;
    /** @type {HTMLElement} */ main;
    /** @type {HTMLElement} */ message;
    /** @type {HTMLElement} */ errorMessage;
    /** @type {HTMLButtonElement} */ createButton;
    /** @type {HTMLButtonElement} */ leaveButton;
    /** @type {HTMLButtonElement} */ copyLinkButton;
    /** @type {HTMLButtonElement} */ becomeHostButton;
    /** @type {?WatchPartyMember} */ member = null;
    /** @type {?WatchPartyHost} */ host = null;
    /** @type {?number} */ errorTimeout = null;

    /**
     * @param {Player} player
     * @param {import("../Storage.js").default} storage
     */
    constructor(player, storage) {
        this.player = player;
        this.storage = storage;
        this.updateStoredSecrets();
        this.create();
        this.updateUI();
    }

    updateUI() {
        let inParty = this.member !== null || this.host !== null;
        this.createButton.style.display = inParty ? 'none' : '';
        this.leaveButton.style.display = inParty ? '' : 'none';
        this.copyLinkButton.style.display = inParty ? '' : 'none';
        this.becomeHostButton.style.display = this.member?.id && this.getStoredSecret(this.member.id) ? '' : 'none';
        this.updateMessage();
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
        content.appendChild(this.message);

        this.createButton = this.createButtonElement('Create Watch Party', this.handleCreateButton.bind(this));
        content.appendChild(this.createButton);

        this.leaveButton = this.createButtonElement('Leave Watch Party', this.handleLeaveButton.bind(this));
        this.leaveButton.style.display = 'none';
        content.appendChild(this.leaveButton);

        this.copyLinkButton = this.createButtonElement('Copy Link', this.handleCopyLinkButton.bind(this));
        this.copyLinkButton.style.display = 'none';
        content.appendChild(this.copyLinkButton);

        this.becomeHostButton = this.createButtonElement('Resume Hosting', this.handleBecomeHost.bind(this));
        this.becomeHostButton.style.display = 'none';
        content.appendChild(this.becomeHostButton);

        this.errorMessage = document.createElement('p');
        this.errorMessage.textContent = '';
        this.errorMessage.style.color = '#D3104AFF';
        this.errorMessage.style.display = 'none';
        content.appendChild(this.errorMessage);
    }

    updateMessage() {
        if (!this.member && !this.host) {
            this.message.textContent = 'Create or join a watch party to watch videos with friends!';
            return;
        }

        if (this.member) {
            let count = this.member.lastStatus?.stats?.viewers ?? 0;
            this.message.textContent = `Watching with ${Math.max(0, count - 1)} others`;
            return;
        }

        let count = this.host.lastStatus?.stats?.viewers ?? 0;
        this.message.textContent = `Hosting for ${Math.max(0, count - 1)} viewers`;
    }

    /**
     * @param message
     */
    showError(message) {
        clearTimeout(this.errorTimeout);
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = '';
        this.errorTimeout = setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 10000);
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
        this.member.addEventListener('update', this.updateUI.bind(this));
        try {
            await this.member.init();
        } catch (e) {
            console.error('Failed to join watch party', e);
            this.showError('Failed to join watch party. The party may no longer exist or your link may be invalid.');
            this.member = null;
        }
        this.updateUI();
        this.busy = false;
    }

    async handleBecomeHost() {
        if (this.busy) {
            return;
        }
        this.busy = true;

        let id = this.member.id;
        let secret = this.getStoredSecret(id);

        if (!secret) {
            this.showError('Failed to resume hosting watch party. The party may no longer exist or your link may be invalid.');
            this.busy = false;
            return;
        }

        try {
            await this.member.destroy();
            this.member = null;
        } catch (e) {
            console.error('Failed to leave watch party', e);
            this.showError('Failed to resume hosting watch party: Failed to leave watch party.');
            this.busy = false;
            return;
        }

        this.host = new WatchPartyHost(this.player, id, secret);
        this.host.addEventListener('update', this.updateUI.bind(this));
        try {
            await this.host.init();
        } catch (e) {
            console.error('Failed to resume hosting watch party', e);
            this.showError('Failed to resume hosting watch party. The party may no longer exist or your link may be invalid.');
            this.host = null;
        }

        this.busy = false;
        this.updateUI();
    }

    /**
     * @returns {this}
     */
    updateStoredSecrets() {
        let secrets = this.storage.get('watchPartySecrets') ?? {};
        console.log('Updating stored secrets', secrets);
        for (let id of Object.keys(secrets)) {
            console.log('Checking secret', id);
            let secret = secrets[id];
            if (typeof secret !== 'object') {
                delete secrets[id];
            }
            if (typeof secret.expires !== 'number' || secret.expires < Date.now()) {
                delete secrets[id];
            }
            if (typeof secret.secret !== 'string') {
                delete secrets[id];
            }
        }
        this.storage.set('watchPartySecrets', secrets);
        return this;
    }

    /**
     * @param {string} id
     * @returns {string|null}
     */
    getStoredSecret(id) {
        let secrets = this.storage.get('watchPartySecrets');
        if (!secrets) {
            return null;
        }
        return secrets[id]?.secret ?? null;
    }

    /**
     * @param {string} id
     * @param {string} secret
     * @returns {this}
     */
    storeSecret(id, secret) {
        let secrets = this.storage.get('watchPartySecrets') ?? {};
        secrets[id] = {
            secret,
            expires: Date.now() + 1000 * 60 * 60 * 24
        };
        this.storage.set('watchPartySecrets', secrets);
        return this;
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
        this.host.addEventListener('update', this.updateUI.bind(this));
        try {
            await this.host.init();
            self.location.hash = '#dhparty-' + this.host.id;
            this.storeSecret(this.host.id, this.host.secret);
        } catch (e) {
            console.error('Failed to create watch party', e);
            this.showError('Failed to create watch party');
            this.host = null;
        }
        this.updateUI();
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
            this.showError('Failed to leave watch party');
        }
        if (self.location.hash.startsWith('#dhparty-')) {
            self.location.hash = '';
        }
        this.updateUI();
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

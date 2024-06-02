import WatchPartyHost from "../WatchParty/WatchPartyHost.js";
import WatchPartyMember from "../WatchParty/WatchPartyMember.js";
import ScheduledSession from "../WatchParty/ScheduledSession.js";
import Tooltip from "./Tooltip.js";
import PartyListEntry from "./PartyListEntry.js";
import Logger from "../Logger.js";

export default class WatchPartySection {
    /** @type {Player} */ player;
    /** @type {import("../Storage/Storage.js").default} */ storage;
    /** @type {boolean} */ busy = false;
    /** @type {HTMLElement} */ main;
    /** @type {HTMLElement} */ message;
    /** @type {HTMLElement} */ errorMessage;
    /** @type {PartyListEntry[]} */ previousParties;
    /** @type {HTMLButtonElement} */ createButton;
    /** @type {HTMLButtonElement} */ leaveButton;
    /** @type {HTMLButtonElement} */ copyLinkButton;
    /** @type {HTMLButtonElement} */ becomeHostButton;
    /** @type {Tooltip} */ copyLinkTooltip;
    /** @type {?WatchPartyController} */ controller = null;
    /** @type {?number} */ errorTimeout = null;
    /** @type {?string} */ title;
    /** @type {Logger} */ logger = new Logger('WatchParty');

    /**
     * @param {Player} player
     * @param {import("../Storage/Storage.js").default} storage
     * @param {?string} title
     */
    constructor(player, storage, title) {
        this.player = player;
        this.storage = storage;
        this.title = title;
        this.storage.updatePreviousParties();
        this.create();
        this.updateUI();
    }

    updateUI() {
        let inParty = this.controller !== null;
        this.createButton.style.display = inParty ? 'none' : '';
        this.leaveButton.style.display = inParty ? '' : 'none';
        this.copyLinkButton.style.display = inParty ? '' : 'none';
        this.becomeHostButton.style.display = this.controller instanceof WatchPartyMember && this.controller.id && this.storage.getPreviousPartySecret(this.controller.id) ? '' : 'none';
        this.updateMessage();

        let i = 0;
        for (let entry of this.previousParties) {
            entry.setVisibility(entry.id !== this.controller?.id && i < 5);
            i++;
        }
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

        let tooltip = new Tooltip('Create a watch party');
        this.createButton = this.createButtonElement('Create', this.handleCreateButton.bind(this), tooltip);
        content.appendChild(this.createButton);
        content.appendChild(tooltip.getHtml());

        tooltip = new Tooltip('Leave watch party');
        this.leaveButton = this.createButtonElement('Leave', this.handleLeaveButton.bind(this), tooltip);
        this.leaveButton.style.display = 'none';
        content.appendChild(this.leaveButton);
        content.appendChild(tooltip.getHtml());

        this.copyLinkTooltip = new Tooltip('Copy link');
        this.copyLinkButton = this.createButtonElement('Copy Link', this.handleCopyLinkButton.bind(this), this.copyLinkTooltip);
        this.copyLinkButton.style.display = 'none';
        content.appendChild(this.copyLinkButton);
        content.appendChild(this.copyLinkTooltip.getHtml());

        tooltip = new Tooltip('Resume controlling this watch party');
        this.becomeHostButton = this.createButtonElement('Resume Hosting', this.handleBecomeHost.bind(this), tooltip);
        this.becomeHostButton.style.display = 'none';
        content.appendChild(this.becomeHostButton);
        content.appendChild(tooltip.getHtml());

        this.errorMessage = document.createElement('p');
        this.errorMessage.textContent = '';
        this.errorMessage.style.color = '#D3104AFF';
        this.errorMessage.style.display = 'none';
        content.appendChild(this.errorMessage);

        let previousPartiesWrapper = document.createElement('div');
        previousPartiesWrapper.classList.add('margin-top-medium', 'margin-bottom-small', 'margin-left-medium', 'margin-right-medium');
        this.main.appendChild(previousPartiesWrapper);

        let previousParties = this.storage.getPreviousParties()
            .sort((a, b) => b.lastUpdate - a.lastUpdate);
        this.previousParties = [];
        for (let party of previousParties) {
            let entry = new PartyListEntry(party.id, party.title, !!party.secret);
            this.previousParties.push(entry);
            entry.addEventListener('join', async () => {
                await this.join(party.id);
            });
            entry.addEventListener('host', async () => {
                await this.host(party.id, party.secret);
            });
            previousPartiesWrapper.appendChild(entry.getHtml());
        }
    }

    updateMessage() {
        if (!this.controller) {
            this.message.textContent = 'Create or join a watch party to watch videos with friends!';
            return;
        }

        if (this.controller instanceof WatchPartyMember) {
            let count = this.controller.lastStatus?.stats?.viewers ?? 0;
            this.message.textContent = `Watching with ${Math.max(0, count - 1)} others`;
            return;
        }

        if (this.controller instanceof WatchPartyHost) {
            let count = this.controller.lastStatus?.stats?.viewers ?? 0;
            this.message.textContent = `Hosting for ${Math.max(0, count - 1)} viewers`;
            return;
        }

        if (this.controller instanceof ScheduledSession) {
            let text = 'Scheduled session';
            let startTime = this.controller.startTime;
            if (startTime !== null) {
                if (startTime < Date.now()) {
                    text += ` started at ${new Date(startTime).toLocaleString()}`;
                } else {
                    text += ` starting at ${new Date(startTime).toLocaleString()}`;
                }
            }
            this.message.textContent = text;
            return;
        }
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

        try {
            await this.leave();
        } catch (e) {
            this.logger.error('Failed to leave watch party', e);
            this.showError('Failed to join watch party: Failed to leave current watch party.');
            this.busy = false;
            return;
        }

        this.controller = new WatchPartyMember(id, this.player, this.storage);
        this.controller.addEventListener('update', this.updateUI.bind(this));
        try {
            await this.controller.init();
        } catch (e) {
            this.logger.error('Failed to join watch party', e);
            this.showError('Failed to join watch party. The party may no longer exist or your link may be invalid.');
            this.controller = null;
        }

        this.updateUrl();
        this.updateUI();
        this.busy = false;
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async joinScheduledSession(id) {
        if (this.busy) {
            return;
        }
        this.busy = true;

        this.controller = new ScheduledSession(id, this.player, this.storage);
        this.controller.addEventListener('update', this.updateUI.bind(this));
        try {
            await this.controller.init();
        } catch (e) {
            this.logger.error('Failed to join scheduled session', e);
            this.showError('Failed to join scheduled session. Your link may be invalid.');
            this.controller = null;
        }
        this.updateUrl();
        this.updateUI();
        this.busy = false;
    }

    /**
     * @returns {Promise<this>}
     */
    async leave() {
        if (!this.controller) {
            return this;
        }

        await this.controller.destroy();
        this.controller = null;
        return this;
    }

    /**
     * @param {string} id
     * @param {string} secret
     * @returns {Promise<void>}
     */
    async host(id, secret) {
        if (this.busy) {
            return;
        }
        this.busy = true;

        try {
            await this.leave();
        } catch (e) {
            this.logger.error('Failed to leave watch party', e);
            this.showError('Failed to start hosting watch party: Failed to leave current watch party.');
            this.busy = false;
            return;
        }

        this.controller = new WatchPartyHost(this.player, this.storage, this.title, id, secret);
        this.controller.addEventListener('update', this.updateUI.bind(this));
        try {
            await this.controller.init();
        } catch (e) {
            this.logger.error('Failed to start hosting watch party', e);
            this.showError('Failed to start hosting watch party. The party may no longer exist or your link may be invalid.');
            this.controller = null;
        }

        this.busy = false;
        this.updateUrl();
        this.updateUI();
    }

    /**
     * @returns {Promise<void>}
     */
    async handleBecomeHost() {
        if (!this.controller?.id) {
            return;
        }

        let id = this.controller.id;
        let secret = this.storage.getPreviousPartySecret(id);

        if (!secret) {
            this.showError('Failed to resume hosting watch party. The party may no longer exist or your link may be invalid.');
            this.busy = false;
            return;
        }

        await this.host(id, secret);
    }

    /**
     * @param {string} label
     * @param {Function} listener
     * @param {?Tooltip} tooltip
     * @returns {HTMLButtonElement}
     */
    createButtonElement(label, listener, tooltip = null) {
        let button = document.createElement('button');
        button.classList.add('btn', 'btn-transparent', 'margin-bottom-small', 'margin-right-small');
        button.textContent = label;
        button.title = tooltip?.getText() ?? label;
        button.addEventListener('click', listener);
        if (tooltip) {
            button.dataset.tooltip = tooltip.getTooltipData();
        }
        return button;
    }

    /**
     * @returns {Promise<void>}
     */
    async handleCreateButton() {
        if (this.busy || this.controller !== null) {
            return;
        }
        this.busy = true;
        this.controller = new WatchPartyHost(this.player, this.storage, this.title);
        this.controller.addEventListener('update', this.updateUI.bind(this));
        try {
            await this.controller.init();
            this.updateUrl();
        } catch (e) {
            this.logger.error('Failed to create watch party', e);
            this.showError('Failed to create watch party');
            this.controller = null;
        }
        this.updateUI();
        this.busy = false;
    }

    /**
     * @returns {string}
     */
    getUrlHash() {
        if (!this.controller) {
            return '';
        }

        if (this.controller instanceof ScheduledSession) {
            return '#dhscheduled-' + this.controller.id;
        }

        return '#dhparty-' + this.controller.id;
    }

    updateUrl() {
        self.location.hash = this.getUrlHash();
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
            await this.controller?.destroy();
            this.controller = null;
        } catch (e) {
            this.logger.error('Failed to leave watch party', e);
            this.showError('Failed to leave watch party');
        }
        this.updateUrl();
        this.updateUI();
        this.busy = false;
    }

    /**
     * @returns {Promise<void>}
     */
    async handleCopyLinkButton() {
        let url = new URL(window.location.href);
        url.hash = this.getUrlHash();

        await navigator.clipboard.writeText(url.href);
        this.copyLinkTooltip.setText('Copied!');
        setTimeout(() => {
            this.copyLinkTooltip.setText('Copy link');
        }, 1000);
    }

    /**
     * @returns {HTMLElement}
     */
    getHtml() {
        return this.main;
    }
}

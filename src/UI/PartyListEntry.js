import Tooltip from "./Tooltip.js";
import EventTarget from "../Events/EventTarget.js";
import Event from "../Events/Event.js";

export default class PartyListEntry extends EventTarget {
    /** @type {HTMLElement} */ main;
    /** @type {HTMLElement} */ titleElement;
    /** @type {HTMLElement} */ joinButton;
    /** @type {HTMLElement} */ hostButton;
    /** @type {string} */ title;
    /** @type {string} */ id;

    /**
     * @param {string} id
     * @param {string} title
     * @param {boolean} showHostButton
     */
    constructor(id, title, showHostButton = false) {
        super();
        this.id = id;
        this.title = title;
        this.create();
        if (!showHostButton) {
            this.hostButton.style.display = 'none';
        }
    }

    create() {
        this.main = document.createElement('div');
        this.main.dataset.id = this.id;
        this.main.classList.add('party-list-entry', 'border-top', 'site-border-color', 'site-font-secondary-color', 'padding-small');
        this.main.style.display = 'flex';
        this.main.style.flexDirection = 'row';
        this.main.style.justifyContent = 'space-between';

        this.titleElement = document.createElement('div');
        this.titleElement.textContent = this.title;
        this.titleElement.title = this.title;
        this.titleElement.style.whiteSpace = 'nowrap';
        this.titleElement.style.overflow = 'hidden';
        this.titleElement.style.textOverflow = 'ellipsis';
        this.titleElement.style.paddingRight = '10px';
        this.main.appendChild(this.titleElement);

        let buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.flexDirection = 'row';
        buttons.style.gap = '10px';
        this.main.appendChild(buttons);

        buttons.appendChild(
            this.joinButton = this.createButton('Join', this.handleJoin.bind(this), buttons, 'Join this watch party'));
        buttons.appendChild(
            this.hostButton = this.createButton('Host', this.handleHost.bind(this), buttons, 'Continue controlling this watch party'));
    }

    handleJoin() {
        this.dispatchEvent(new Event('join'));
    }

    handleHost() {
        this.dispatchEvent(new Event('host'));
    }

    /**
     * @param {boolean} visible
     */
    setVisibility(visible) {
        this.main.style.display = visible ? 'flex' : 'none';
    }

    /**
     * @param {string} text
     * @param {Function} clickHandler
     * @param {HTMLElement} parent
     * @param {?string} tooltipText
     * @returns {HTMLAnchorElement}
     */
    createButton(text, clickHandler, parent, tooltipText = null) {
        let button = document.createElement('a');
        button.title = tooltipText ?? text;
        button.textContent = text;
        button.style.color = 'inherit';
        button.addEventListener('click', clickHandler);
        parent.appendChild(button);

        if (tooltipText) {
            let tooltip = new Tooltip(tooltipText);
            button.dataset.tooltip = tooltip.getTooltipData();
            parent.appendChild(tooltip.getHtml());
        }

        return button;
    }

    /**
     * @returns {HTMLElement}
     */
    getHtml() {
        return this.main;
    }
}

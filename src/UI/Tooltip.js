export default class Tooltip {
    /** @type {string} */ text;
    /** @type {HTMLElement} */ main;
    /** @type {string} */ id = 'tooltip-' + Math.random().toString(36).substring(2);

    /**
     * @param {string} text
     */
    constructor(text) {
        this.main = document.createElement('div');
        this.main.classList.add('tooltip', 'medium');
        this.main.id = this.id;
        this.setText(text);
    }

    /**
     * @returns {string}
     */
    getText() {
        return this.text;
    }

    /**
     * @param {string} text
     * @returns {this}
     */
    setText(text) {
        this.text = text;
        this.main.textContent = text;
        return this;
    }

    /**
     * @returns {HTMLElement}
     */
    getHtml() {
        return this.main;
    }

    /**
     * @returns {string}
     */
    getId() {
        return this.id;
    }

    /**
     * @returns {string}
     */
    getTooltipData() {
        return JSON.stringify({
            "id": this.getId(),
            "width": "auto",
            "position": "top"
        });
    }
}

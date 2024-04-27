/**
 * Somehow extending EventTarget and Event is not possible in Firefox content scripts
 */
export default class Event {
    /** @type {string} */ type;
    /** @type {Object} */ options;

    /**
     * @param {string} type
     * @param {Object} options
     */
    constructor(type, options = {}) {
        this.type = type;
        this.options = options;
    }
}

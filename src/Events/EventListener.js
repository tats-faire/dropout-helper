export default class EventListener {
    /** @type {Function} */ callback;
    /** @type {boolean} */ once = false;
    /** @type {boolean} */ passive = false;
    /** @type {boolean} */ capture = false;
    /** @type {?AbortSignal} */ signal = null;

    /**
     * @param {Function} callback
     * @param {Object} options
     */
    constructor(callback, options = {}) {
        this.callback = callback;
        Object.assign(this, options);
    }
}

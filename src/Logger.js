export default class Logger {
    /** @type {string} */ name;

    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * @param {*} data
     * @returns {this}
     */
    log(...data) {
        console.log('[DH]', `[${this.name}]`, ...data);
        return this;
    }

    /**
     * @param {*} data
     * @returns {this}
     */
    warn(...data) {
        console.warn('[DH]', `[${this.name}]`, ...data);
        return this;
    }

    /**
     * @param {*} data
     * @returns {this}
     */
    error(...data) {
        console.error('[DH]', `[${this.name}]`, ...data);
        return this;
    }

    /**
     * @param {*} data
     * @returns {this}
     */
    debug(...data) {
        console.debug('[DH]', `[${this.name}]`, ...data);
        return this;
    }
}

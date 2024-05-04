export default class Storage {
    /** @type {string} */ name;
    /** @type {Object} */ data;

    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * @param {string} key
     * @param {*} value
     * @returns {this}
     */
    set(key, value) {
        localStorage.setItem(this.name + '_' + key, JSON.stringify(value));
        return this;
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return !!localStorage.getItem(this.name + '_' + key);
    }

    /**
     * @param {string} key
     * @returns {*}
     */
    get(key) {
        return JSON.parse(localStorage.getItem(this.name + '_' + key));
    }
}

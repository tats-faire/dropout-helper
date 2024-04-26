export default class Storage {
    /** @type {string} */ name;
    /** @type {Object} */ data;

    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
        this.data = {};
        let existing = localStorage.getItem(name);
        if (existing) {
            try {
                this.data = JSON.parse(existing);
            } catch (e) {
            }
        }
    }

    /**
     * @param {Object} data
     * @returns {this}
     */
    set(data) {
        Object.assign(this.data, data);
        localStorage.setItem(this.name, JSON.stringify(this.data));
        return this;
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return key in this.data;
    }

    /**
     * @param {string} key
     * @returns {*}
     */
    get(key) {
        return this.data[key];
    }
}

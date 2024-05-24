export default class StoredParty {
    /** @type {string} */ id;
    /** @type {?string} */ secret = null;
    /** @type {?string} */ title = null;
    /** @type {number} */ lastUpdate;

    /**
     * @param {string} id
     * @param {?string} secret
     * @param {?string} title
     * @param {number} lastUpdate
     */
    constructor(id, secret = null, title = null, lastUpdate = Date.now()) {
        this.id = id;
        this.secret = secret;
        this.title = title;
        this.lastUpdate = lastUpdate;
    }

    /**
     * @param {string} id
     * @param {?string} secret
     * @param {?string} title
     */
    update(id, secret = null, title = null) {
        this.id = id;
        this.secret = secret || this.secret;
        this.title = title || this.title;
        this.lastUpdate = Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            secret: this.secret,
            title: this.title,
            lastUpdate: this.lastUpdate,
        };
    }
}

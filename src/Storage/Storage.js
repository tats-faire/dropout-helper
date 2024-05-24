import StoredParty from "./StoredParty.js";

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

    /**
     * @returns {this}
     */
    updatePreviousParties() {
        let parties = this.getPreviousParties();
        let updated = parties.filter(party => party.lastUpdate > Date.now() - 1000 * 60 * 60 * 24);
        this.savePreviousParties(updated);
        return this;
    }

    /**
     * @returns {StoredParty[]}
     */
    getPreviousParties() {
        let data = this.get('previousParties') ?? [];
        return data.map(party => new StoredParty(party.id, party.secret, party.title, party.lastUpdate));
    }

    /**
     * @param {StoredParty[]} parties
     * @returns {this}
     */
    savePreviousParties(parties) {
        this.set('previousParties', parties);
        return this;
    }

    /**
     * @param {string} id
     * @param {?string} secret
     * @param {string} title
     * @returns {this}
     */
    storePreviousParty(id, secret, title) {
        let parties = this.getPreviousParties();
        let existing = parties.find(party => party.id === id);
        if (existing) {
            existing.update(id, secret, title);
        } else {
            parties.push(new StoredParty(id, secret, title));
        }
        this.savePreviousParties(parties);
        return this;
    }

    /**
     * @param {string} id
     * @returns {StoredParty}
     */
    getPreviousParty(id) {
        return this.getPreviousParties().find(party => party.id === id);
    }

    /**
     * @param {string} id
     * @returns {?string}
     */
    getPreviousPartySecret(id) {
        return this.getPreviousParty(id)?.secret ?? null;
    }
}

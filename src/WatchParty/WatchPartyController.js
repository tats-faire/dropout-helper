import EventTarget from "../Events/EventTarget.js";

export default class WatchPartyController extends EventTarget {
    /** @type {?string} */ id;
    /** @type {Player} */ player;

    /**
     * @param {string} id
     * @param {Player} player
     */
    constructor(id, player) {
        super();
        this.id = id;
        this.player = player;
    }

    /**
     * @returns {Promise<void>}
     * @abstract
     */
    async init() {

    }

    /**
     * @returns {Promise<void>}
     * @abstract
     */
    async destroy() {

    }
}

import EventTarget from "../Events/EventTarget.js";

export default class WatchPartyController extends EventTarget {
    /** @type {?string} */ id;
    /** @type {Player} */ player;
    /** @type {import("../Storage/Storage.js").default} */ storage;

    /**
     * @param {string} id
     * @param {Player} player
     * @param {Storage} storage
     */
    constructor(id, player, storage) {
        super();
        this.id = id;
        this.player = player;
        this.storage = storage;
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

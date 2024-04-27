import Event from "../Events/Event.js";

export default class PlayerEvent extends Event {
    /** @type {*} */ data;
    /** @type {Player} */ player;

    constructor(type, data, player) {
        super(type);
        this.data = data;
        this.player = player;
    }

    /**
     * @returns {*}
     */
    getData() {
        return this.data;
    }

    /**
     * @returns {Player}
     */
    getPlayer() {
        return this.player;
    }
}

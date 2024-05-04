import Event from "./Event.js";

export default class SocketMessageEvent extends Event {
    /** @type {Message} */ message;
    /** @type {import("../Socket/Socket.js").default} */ socket;

    /**
     * @param {Message} message
     * @param {import("../Socket/Socket.js").default} socket
     */
    constructor(message, socket) {
        super('message');
        this.message = message;
        this.socket = socket;
    }

    /**
     * @returns {Message}
     */
    getMessage() {
        return this.message;
    }

    /**
     * @returns {import("../Socket/Socket.js").default}
     */
    getSocket() {
        return this.socket;
    }
}

import Event from "./Event.js";

export default class SocketStatusEvent extends Event {
    /** @type {WatchPartyStatus} */ status;
    /** @type {import("../Socket/Socket.js").default} */ socket;

    /**
     * @param {WatchPartyStatus} status
     * @param {import("../Socket/Socket.js").default} socket
     */
    constructor(status, socket) {
        super('status');
        this.status = status;
        this.socket = socket;
    }

    /**
     * @returns {WatchPartyStatus}
     */
    getStatus() {
        return this.status;
    }

    /**
     * @returns {import("../Socket/Socket.js").default}
     */
    getSocket() {
        return this.socket;
    }
}

import Socket from "../Socket/Socket.js";
import WatchPartyStatus from "./WatchPartyStatus.js";

export default class WatchPartyHost {
    /** @type {string} */ id;
    /** @type {string} */ secret;
    /** @type {import("../Socket/Socket.js").default} */ socket;
    /** @type {Player} */ player;
    /** @type {number} */ updateInterval;
    /** @type {Function} */ _publishUpdate;

    /**
     * @param {Player} player
     * @param {?string} id
     * @param {?string} secret
     */
    constructor(player, id = null, secret = null) {
        this.id = id;
        this.secret = secret;
        this.player = player;
        this.socket = new Socket();

        this._publishUpdate = this.publishUpdate.bind(this);
        this.player.addEventListener('seeked', this._publishUpdate);
        this.player.addEventListener('play', this._publishUpdate);
        this.player.addEventListener('pause', this._publishUpdate);
    }

    /**
     * @returns {Promise<void>}
     */
    async init() {
        await this.socket.connect();
        let status = await this.collectStatusInfo();
        if (this.id === null || this.secret === null) {
            let result = await this.socket.create(status);
            this.id = result.id;
            this.secret = result.secret;
        } else {
            await this.socket.update(status);
        }
        this.updateInterval = setInterval(this._publishUpdate, 5000);
    }

    /**
     * @returns {Promise<void>}
     */
    async destroy() {
        clearInterval(this.updateInterval);
        this.socket.close();

        this.player.removeEventListener('seeked', this._publishUpdate);
        this.player.removeEventListener('play', this._publishUpdate);
        this.player.removeEventListener('pause', this._publishUpdate);
    }

    /**
     * @returns {Promise<void>}
     */
    async publishUpdate() {
        try {
            await this.socket.update(await this.collectStatusInfo());
        } catch (e) {
            console.error('Failed to publish update', e);
        }
    }

    /**
     * @returns {Promise<WatchPartyStatus>}
     */
    async collectStatusInfo() {
        let status = new WatchPartyStatus();
        status.id = this.id;
        status.secret = this.secret;
        status.url = window.location.href.split('#')[0].split('?')[0];
        status.time = await this.player.getCurrentTime();
        status.playing = await this.player.isPlaying();
        return status;
    }
}

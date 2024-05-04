import Socket from "../Socket/Socket.js";

export default class WatchPartyMember {
    /** @type {string} */ id;
    /** @type {import("../Socket/Socket.js").default} */ socket;
    /** @type {Player} */ player;
    /** @type {?WatchPartyStatus} */ lastStatus = null;
    /** @type {boolean} */ scheduledUpdate = true;
    /** @type {boolean} */ isUpdating = false;
    /** @type {number} */ seekScore = 2;
    /** @type {Function} */ _applyScheduledUpdate;
    /** @type {Function} */ _applyStatus;

    /**
     * @param {string} id
     * @param {Player} player
     */
    constructor(id, player) {
        this.id = id;
        this.player = player;
        this.socket = new Socket();
        this.socket.addEventListener('status', this.handleSocketStatus.bind(this));
        this.socket.addEventListener('reconnect', this.handleReconnect.bind(this));

        this._applyScheduledUpdate = this.applyScheduledUpdate.bind(this);
        this._applyStatus = this.applyStatus.bind(this);
        this.player.addEventListener('seeked', this._applyScheduledUpdate);
        this.player.addEventListener('loadeddata', this._applyScheduledUpdate);
        this.player.addEventListener('play', this._applyStatus);
        this.player.addEventListener('pause', this._applyStatus);
    }

    async init() {
        await this.socket.connect();
        try {
            await this.socket.subscribe(this.id);
        } catch (e) {
            this.socket.close();
        }
    }

    /**
     * @param {SocketStatusEvent} event
     * @returns {Promise<void>}
     */
    async handleSocketStatus(event) {
        this.lastStatus = event.getStatus();
        await this.applyStatus();
    }

    /**
     * @returns {Promise<void>}
     */
    async handleReconnect() {
        await this.socket.subscribe(this.id);
    }

    /**
     * @returns {Promise<void>}
     */
    async destroy() {
        try {
            await this.socket.unsubscribe(this.id);
        } catch (e) {
            console.error('Failed to unsubscribe from watch party', e);
        }
        this.socket.close();

        this.player.removeEventListener('seeked', this._applyScheduledUpdate);
        this.player.removeEventListener('loadeddata', this._applyScheduledUpdate);
        this.player.removeEventListener('play', this._applyStatus);
        this.player.removeEventListener('pause', this._applyStatus);
    }

    /**
     * @returns {Promise<void>}
     */
    async applyScheduledUpdate() {
        if (!this.scheduledUpdate) {
            return;
        }
        this.scheduledUpdate = false;
        await this.applyStatus();
    }

    /**
     * @returns {Promise<void>}
     */
    async applyStatus() {
        if (!this.lastStatus || this.isUpdating) {
            return;
        }
        this.isUpdating = true;
        let lastStatus = this.lastStatus;
        let url = new URL(lastStatus.url);
        if (self.location.host !== url.host || self.location.pathname !== url.pathname) {
            await this.destroy();
            url.hash = '#dhparty-' + this.id;
            self.location = url.href;
            this.isUpdating = false;
            return;
        }

        if (this.player.isLoading() || this.player.isSeeking()) {
            this.scheduledUpdate = true;
            this.isUpdating = false;
            return;
        }

        if (lastStatus.playing !== await this.player.isPlaying()) {
            if (lastStatus.playing) {
                await this.player.play();
            } else {
                await this.player.pause();
            }
        }

        let time = await this.player.getCurrentTime();
        let targetTime = lastStatus.getTime() + (this.socket.getPing() / 1000 / 2);
        let diff = Math.abs(targetTime - time);
        let threshold = Math.min(0.5 * this.seekScore, 3);
        if (Math.abs(diff) > threshold) {
            this.seekScore++;
            await this.player.seekTime(targetTime + Math.min(this.player.getAverageSeekTime() / 1000, 4));
        } else {
            this.seekScore = Math.max(1, this.seekScore - 1);
        }

        this.isUpdating = false;
    }
}

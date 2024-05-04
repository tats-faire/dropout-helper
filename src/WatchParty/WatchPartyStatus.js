export default class WatchPartyStatus {
    /** @type {?string} */ secret = null
    /** @type {string} */ id;
    /** @type {string} */ url;
    /** @type {number} */ time = 0;
    /** @type {number} */ lastUpdate = Date.now();
    /** @type {number} */ createdAt = Date.now();
    /** @type {number} */ speed = 1;
    /** @type {boolean} */ playing = true;

    getTime() {
        let time = this.time;
        if (this.playing) {
            time += (Date.now() - this.createdAt) / 1000 * this.speed;
        }
        return time;
    }

    toJSON() {
        return {
            secret: this.secret,
            id: this.id,
            url: this.url,
            time: this.time,
            lastUpdate: this.lastUpdate,
            speed: this.speed,
            playing: this.playing
        };
    }
}

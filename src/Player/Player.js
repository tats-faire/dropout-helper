import PendingRequest from "./PendingRequest.js";
import SubtitleInfo from "./SubtitleInfo.js";
import PlayerEvent from "./PlayerEvent.js";
import EventTarget from "../Events/EventTarget.js";

/**
 * Vimeo OTT player API
 * There is an official implementation of this, but it unfortunately sucks
 */
export default class Player extends EventTarget {
    /** @type {WeakMap<Window, Player>} */ static players = new WeakMap();

    /** @type {Window} */ contentWindow;
    /** @type {Map<string, PendingRequest[]>} */ waitingMethods = new Map();
    /** @type {boolean} */ loading = false;
    /** @type {boolean} */ seeking = false;
    /** @type {?number} */ averageSeekTime = null;
    /** @type {?number} */ seekStartTime = null;

    /**
     * Get the player instance for a given player iframe
     *
     * @param {HTMLIFrameElement} iframe
     * @returns {Player}
     */
    static get(iframe) {
        let contentWindow = iframe.contentWindow;
        if (this.players.has(contentWindow)) {
            return this.players.get(contentWindow);
        }
        let player = new Player(contentWindow);
        this.players.set(contentWindow, player);
        return player;
    }

    /**
     * @param {Window} contentWindow
     * @internal Use `Player.get` instead
     */
    constructor(contentWindow) {
        super();
        this.contentWindow = contentWindow;
        self.addEventListener('message', this.handleMessage.bind(this));

        this.addEventListener('seeking', this.handleSeekStart.bind(this));
        this.addEventListener('seeked', this.handleSeekEnd.bind(this));
        this.addEventListener('loadstart', () => this.loading = true);
        this.addEventListener('loadeddata', () => this.loading = false);
    }

    /**
     * @returns {this}
     */
    handleSeekStart() {
        this.seekStartTime = Date.now();
        this.seeking = true;
        return this;
    }

    /**
     * @returns {this}
     */
    handleSeekEnd() {
        this.seeking = false;
        if (this.seekStartTime === null) {
            return this;
        }

        let time = Date.now() - this.seekStartTime;
        this.seekStartTime = null;
        if (this.averageSeekTime === null) {
            this.averageSeekTime = time;
        } else {
            this.averageSeekTime = (this.averageSeekTime + time) / 2;
        }
        return this;
    }

    /**
     * @returns {boolean}
     */
    isSeeking() {
        return this.seeking;
    }

    /**
     * @returns {boolean}
     */
    isLoading() {
        return this.loading;
    }

    /**
     * @returns {number}
     */
    getAverageSeekTime() {
        return this.averageSeekTime ?? 0;
    }

    /**
     * Send a request to the player and wait for a response
     *
     * @param {string} method
     * @param {*} parameters
     * @returns {Promise<*>}
     */
    callMethod(method, parameters = {}) {
        let waiting;
        let promise = new Promise((resolve, reject) => {
            waiting = new PendingRequest(resolve, reject);
        });
        if (!this.waitingMethods.has(method)) {
            this.waitingMethods.set(method, []);
        }
        this.waitingMethods.get(method).push(waiting);
        this.sendMethod(method, parameters);
        return promise;
    }

    /**
     * Send a request to the player without waiting for a response
     *
     * @param {string} method
     * @param {*} parameters
     */
    sendMethod(method, parameters = {}) {
        this.contentWindow.postMessage(JSON.stringify({method, params: parameters}), '*');
    }

    /**
     * @param {Object} data
     */
    handleResponse(data) {
        if (!this.waitingMethods.has(data.method)) {
            return;
        }
        let waiting = this.waitingMethods.get(data.method).shift();
        if (waiting) {
            if (data.error) {
                waiting.reject(new Error(data.error));
            } else {
                waiting.resolve(data.response);
            }
        }
    }

    /**
     * @param {MessageEvent} event
     */
    handleMessage(event) {
        if (event.source !== this.contentWindow) {
            return;
        }
        let data = event.data;
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            }catch (e) {
                return;
            }
        }
        if (typeof data !== 'object' || !data.method) {
            return;
        }

        this.dispatchEvent(new PlayerEvent(data.method, data.params, this));

        if (data.method === 'response') {
            this.handleResponse(data.params);
        }
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMuted() {
        return await this.callMethod('muted');
    }

    /**
     * @param muted
     * @returns {this}
     */
    setMuted(muted) {
        this.sendMethod('muted', [muted]);
        return this;
    }

    /**
     * @returns {Promise<number>}
     */
    async getBufferedPercent() {
        return await this.callMethod('bufferedPercent');
    }

    /**
     * @returns {Promise<number>}
     */
    async getCurrentTime() {
        return await this.callMethod('currentTime');
    }

    /**
     * @returns {Promise<number>}
     */
    async getDuration() {
        return await this.callMethod('duration');
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isFullscreen() {
        return await this.callMethod('isFullscreen');
    }

    exitFullscreen() {
        return this.sendMethod('exitFullscreen');
    }

    /**
     * @returns {Promise<number>}
     */
    async getRemainingTime() {
        return await this.callMethod('remainingTime');
    }

    /**
     * @returns {Promise<number>}
     */
    async getVolume() {
        return await this.callMethod('volume');
    }

    /**
     * @param {number} volume
     * @returns {this}
     */
    setVolume(volume) {
        this.sendMethod('volume', [volume]);
        return this;
    }

    /**
     * This is hardcoded to true in the player API, so you might as well not use it
     *
     * @returns {Promise<boolean>}
     */
    async isReadyToPlay() {
        return await this.callMethod('isReadyToPlay');
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isPlaying() {
        return await this.callMethod('isPlaying');
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isFinished() {
        return await this.callMethod('isFinished');
    }

    /**
     * This is hardcoded to true in the player API, so you might as well not use it
     *
     * @returns {Promise<boolean>}
     */
    async hasMultipleResolutions() {
        return await this.callMethod('hasMultipleResolutions');
    }

    /**
     * @returns {Promise<SubtitleInfo[]>}
     */
    async getSubtitles() {
        let result = await this.callMethod('getSubtitles');
        return result.map((info) => {
            let subtitleInfo = new SubtitleInfo();
            Object.assign(subtitleInfo, info);
            return subtitleInfo;
        });
    }

    /**
     * Set the subtitle language (e.g. 'en', or null for no subtitles)
     * Like for most setters, the underlying API method does not return anything,
     * so you just have to call this and hope for the best.
     * There is an error thrown in the player iframe if you pass an invalid language, so don't do that.
     *
     * @param {string} language
     */
    setSubtitle(language) {
        return this.sendMethod('setSubtitle', [language]);
    }

    /**
     * @returns {this}
     */
    dispose() {
        this.sendMethod('dispose');
        return this;
    }

    /**
     * @returns {this}
     */
    play() {
        this.sendMethod('play');
        return this;
    }

    /**
     * @returns {this}
     */
    pause() {
        this.sendMethod('pause');
        return this;
    }

    /**
     * @returns {this}
     */
    seekTime(time) {
        this.sendMethod('seekToTime', [time]);
        return this;
    }
}

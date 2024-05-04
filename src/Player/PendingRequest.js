export default class PendingRequest {
    /** @type {Function} */ resolve;
    /** @type {Function} */ reject;
    /** @type {number} */ startTime;

    /**
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
        this.startTime = Date.now();
    }
}

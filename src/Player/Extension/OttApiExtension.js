import OttApiMessage from "../OttApiMessage.js";

export default class OttApiExtension {
    /** @type {Window} */ inboundTarget;
    /** @type {Window} */ outboundTarget;
    /** @type {string} */ outboundOrigin;
    /** @type {string} */ namespace;
    /** @type {Function} */ _handleInboundMessage;
    /** @type {Map<string, function(OttApiMessage): Promise<?OttApiMessage>>} */ handlers = new Map();

    /**
     * @param {string} namespace
     * @param {Window} inboundTarget
     * @param {Window} outboundTarget
     * @param {string} outboundOrigin
     */
    constructor(namespace, inboundTarget, outboundTarget, outboundOrigin = '*') {
        this.namespace = namespace;
        this.inboundTarget = inboundTarget;
        this.outboundTarget = outboundTarget;
        this.outboundOrigin = outboundOrigin;

        this._handleInboundMessage = this.handleInboundMessage.bind(this);
        this.inboundTarget.addEventListener('message', this._handleInboundMessage);

        this.registerHandler('init', this.init.bind(this));
    }

    /**
     * @param {OttApiMessage} message
     * @returns {Promise<OttApiMessage>}
     */
    async init(message) {
        return message.respond(true);
    }

    /**
     * @returns {Promise<void>}
     */
    async destroy() {
        this.sendMessage(new OttApiMessage('destroy'));
        this.inboundTarget.removeEventListener('message', this._handleInboundMessage);
    }

    /**
     * @param {string} method
     * @param {function(OttApiMessage): Promise<?OttApiMessage>} handler
     * @returns {this}
     */
    registerHandler(method, handler) {
        this.handlers.set(method, handler);
        return this;
    }

    /**
     * @param {MessageEvent} event
     * @returns {Promise<void>}
     */
    async handleInboundMessage(event) {
        let message = OttApiMessage.fromMessage(event);
        if (message === null || message.getExtension() !== this.namespace) {
            return;
        }

        if (!this.handlers.has(message.getMethod())) {
            return;
        }

        let response;
        try {
            response = await this.handlers.get(message.getMethod())(message);
        } catch (e) {
            response = message.respond(null, e);
        }

        if (response !== null) {
            this.sendMessage(response);
        }
    }

    /**
     * @param {OttApiMessage} message
     * @returns {this}
     */
    sendMessage(message) {
        message.setExtension(this.namespace);
        this.outboundTarget.postMessage(JSON.stringify(message), this.outboundOrigin);
        return this;
    }
}

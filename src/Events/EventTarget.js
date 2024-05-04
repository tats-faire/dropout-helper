import EventListener from "./EventListener.js";

/**
 * Somehow extending EventTarget and Event is not possible in Firefox content scripts
 */
export default class EventTarget {
    /** @type {Map<string, EventListener[]>} */ eventListeners = new Map();

    /**
     * Add an event listener
     *
     * @param {string} type
     * @param {Function} listener
     * @param {Object} options
     */
    addEventListener(type, listener, options = {}) {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, []);
        }
        let eventListener = new EventListener(listener, options);
        eventListener.signal?.addEventListener('abort', () => {
            this.removeEventListener(type, listener);
        });

        this.eventListeners.get(type).push(eventListener);
    }

    /**
     * Remove an event listener
     *
     * @param {string} type
     * @param {Function} listener
     */
    removeEventListener(type, listener) {
        if (!this.eventListeners.has(type)) {
            return;
        }
        let listeners = this.eventListeners.get(type);
        let index = listeners.findIndex(eventListener => eventListener.callback === listener);
        if (index === -1) {
            return;
        }
        listeners.splice(index, 1);
    }

    /**
     * Dispatch an event
     *
     * @param {Event} event
     */
    dispatchEvent(event) {
        if (!this.eventListeners.has(event.type)) {
            return;
        }
        for (let eventListener of this.eventListeners.get(event.type).slice()) {
            if (eventListener.once) {
                this.removeEventListener(event.type, eventListener.callback);
            }
            try {
                eventListener.callback(event);
            } catch (e) {
                console.error('Error in event listener', e);
            }
        }
    }
}

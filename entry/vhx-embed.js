import PlaybackRateExtension from "../src/Player/Extension/PlaybackRateExtension.js";

const referer = document.referrer;
const origin = referer ? new URL(referer).origin : '*';

const parent = window.parent;

if (!parent) {
    throw new Error('No parent window found');
}

(async () => {
    await new PlaybackRateExtension(window, parent, origin);
})();

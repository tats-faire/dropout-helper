import PlaybackRateExtension from "../src/Player/Extension/PlaybackRateExtension.js";
import cookie from 'cookie';
import Logger from "../src/Logger.js";
import Storage from "../src/Storage/Storage.js";

(async () => {
    let storage = new Storage('_dropout_helper');
    let logger = new Logger('VHX-Embed');

    // Thanks, Firefox, for making this necessary
    // Inject the script into the main page if we are running in Firefox
    if (typeof window.wrappedJSObject !== 'undefined') {
        logger.debug('Injecting script into main world');
        let script = document.createElement('script');
        script.src = chrome.runtime.getURL('js/vhx-embed.js');
        script.async = false;
        document.head.appendChild(script);
        return;
    }

    logger.debug('Content script running.');
    const referer = document.referrer;
    const origin = referer ? new URL(referer).origin : '*';

    const parent = window.parent;

    if (parent) {
        new PlaybackRateExtension(window, parent, origin);
    } else {
        logger.error('No parent window found');
    }

    // Fix player settings storage
    // Vimeo stores players settings, such as volume and subtitle settings, in a cookie.
    // It does, however, try to save this cookie for the domain '.vimeo.com', which does
    // not work, since the OTT player is hosted on a different domain.
    // This fix will
    // - Change the configured cookie domain
    // - Insert the player settings from the cookie in the initial settings API response,
    //   since the API is hosted on vimeo.com, and therefore doesn't have access to the cookie.
    let origJson = Response.prototype.json;

    Response.prototype.json = async function() {
        let res = await origJson.apply(this);
        return patchSettings(res);
    };

    // Catch cookie changes and save player settings to local storage
    let cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(Document.prototype, 'cookie', {
        get: function() {
            return cookieDesc.get.apply(this);
        },
        set(v) {
            try {
                let parsed = cookie.parse(v);
                if (parsed.player) {
                    logger.debug('Saving player settings to storage', parsed.player);
                    storage.set('player', parsed.player);
                }
            } catch (e) {
                logger.error('Failed to parse player cookie', e);
            }
            try {
                return cookieDesc.set.apply(this, [v]);
            } catch (e) {
                logger.error('Failed to set cookie', e);
            }
        }
    });

    function patchSettings(settings) {
        if (typeof settings !== "object" || !settings.vimeo_api_url || typeof settings.request !== "object") {
            return settings;
        }

        let options;
        try {
            let playerCookie = storage.get('player');
            if (playerCookie) {
                options = new URLSearchParams(playerCookie);
            }
        } catch (e) {
            logger.error('Failed to parse player cookie', e);
            return settings;
        }

        if (!options) {
            return settings;
        }

        settings.request.cookie_domain = self.location.hostname;
        if (typeof settings.request.cookie !== "object") {
            settings.request.cookie = {};
        }

        settings.request.cookie.volume = options.get('volume') ?? 1;
        settings.request.cookie.captions = options.get('captions') ?? null;

        if (typeof settings.request.cookie.captions_styles !== "object") {
            settings.request.cookie.captions_styles = {};
        }
        settings.request.cookie.captions_styles.color = options.get('captions_color') ?? null;
        settings.request.cookie.captions_styles.fontSize = options.get('captions_font_size') ?? null;
        settings.request.cookie.captions_styles.fontFamily = options.get('captions_font_family') ?? null;
        settings.request.cookie.captions_styles.fontOpacity = options.get('captions_font_opacity') ?? null;
        settings.request.cookie.captions_styles.bgOpacity = options.get('captions_bg_opacity') ?? null;
        settings.request.cookie.captions_styles.windowColor = options.get('captions_window_color') ?? null;
        settings.request.cookie.captions_styles.windowOpacity = options.get('captions_window_opacity') ?? null;
        settings.request.cookie.captions_styles.bgColor = options.get('captions_bg_color') ?? null;
        settings.request.cookie.captions_styles.edgeStyle = options.get('captions_edge') ?? null;

        logger.debug('Patched initial player settings', settings);

        return settings;
    }
})();






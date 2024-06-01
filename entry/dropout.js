import Storage from "../src/Storage/Storage.js";
import Player from "../src/Player/Player.js";
import WatchPartySection from "../src/UI/WatchPartySection.js";

let seriesLink = document.querySelector('a.custom-nav-series');
if (seriesLink) {
    seriesLink.removeAttribute('target');
}

(async () => {
    let storage = new Storage('_dropout_helper');
    let iframe = document.getElementById('watch-embed');
    if (iframe === null) {
        return;
    }

    let seriesTitleElement = document.querySelector('.series-title');
    let videoTitleElement = document.querySelector('.video-title');
    let title = null;
    if (seriesTitleElement && videoTitleElement) {
        title = `${seriesTitleElement.textContent.trim()}: ${videoTitleElement.textContent.trim()}`;
    } else {
        title = seriesTitleElement?.textContent.trim() ?? videoTitleElement?.textContent.trim() ?? null;
    }

    let player = Player.get(iframe);

    let shareTools = document.querySelector('div.share-tools');
    let column = shareTools.parentElement;
    let watchPartySection = new WatchPartySection(player, storage, title);
    column.insertBefore(watchPartySection.getHtml(), shareTools);

    // The volumechange even is emitted whenever the volume is changed or the player is muted/unmuted
    // It does, however, not include the muted state, so we have to check that separately
    player.addEventListener('volumechange', async e => {
        let volume = e.getData().volume;
        let muted = await player.isMuted();
        if (volume === storage.get('volume') && muted === storage.get('muted')) {
            return;
        }

        storage.set('volume', e.getData().volume);
        storage.set('muted', await player.isMuted());
    });

    player.addEventListener('playback-rate:ratechange', async e => {
        let rate = e.getData();
        if (rate === storage.get('playbackRate')) {
            return;
        }

        storage.set('playbackRate', rate);
    });

    player.addEventListener('loadstart', async e => {
        player.initExtension('playback-rate').catch(e => console.error('Failed to init playback rate extension', e));

        if (storage.has('volume')) {
            player.setVolume(storage.get('volume'));
        }

        if (storage.has('muted')) {
            await player.setMuted(storage.get('muted'));
        }

        if (storage.has('subtitles')) {
            await player.setSubtitle(storage.get('subtitles'));
        }

        // Only start watching settings after the player has loaded
        startWatchingSettings();

        if (self.location.hash.startsWith('#dhparty-')) {
            let id = self.location.hash.slice(9);
            await watchPartySection.join(id);
        } else if (self.location.hash.startsWith('#dhscheduled-')) {
            let id = self.location.hash.slice(13);
            await watchPartySection.joinScheduledSession(id);
        }
    });

    function startWatchingSettings() {
        // Set the playback rate as soon as the extension is initialized
        player.addEventListener('playback-rate:init', () => {
            if (storage.has('playbackRate')) {
                player.setPlaybackRate(storage.get('playbackRate'));
            }
        })

        // There is no event for changing subtitles, so we have to poll for it
        setInterval(async () => {
            let captions = await player.getSubtitles();
            let active = captions.find(caption => caption.mode === 'showing');
            let id = active ? active.language : null;
            if (storage.get('subtitles') === id) {
                return;
            }
            storage.set('subtitles', id);
        }, 1000);
    }
})();


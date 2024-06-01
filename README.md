# DropoutHelper
This is a simple Chrome/Firefox extension that makes [Dropout](https://dropout.tv) remember
your volume settings and enabled subtitles. Additionally, it includes a watch party feature that allows for
easily watching videos in sync with other people. It also includes a custom client for the 
Vimeo OTT player API because the official one isn't great.

In theory, this addon could be extended to work on any Vimeo OTT platform, 
but nobody else really uses Vimeo OTT, so I'm not going to bother.

## Installation

Chrome: https://chromewebstore.google.com/detail/dropouthelper/jpdeijennnlahlhcoihhenodnolgdapl

Firefox: https://addons.mozilla.org/en-US/firefox/addon/dropouthelper/

## Manual Installation on chrome
1. Download the latest release from the releases page
2. Unzip the file
3. Open Chrome and go to `chrome://extensions`
4. Enable Developer Mode
5. Click "Load Unpacked" and select the unzipped folder

## Usage
1. Go to Dropout and start watching a video
2. Set your volume and subtitles
3. Done

## Building
1. Clone the repository
2. Make sure you have Node.js and NPM installed
3. Run `npm install`
4. Run `npm run build`
5. The built extension will be in the `dist` folder

# DropoutHelper
This is a simple Chrome extension that makes [Dropout](https://dropout.tv) remember
your volume settings and enabled subtitles. It also includes a custom client for the 
Vimeo OTT player API because the official one sucks.

In theory, this addon could be extended to work on any Vimeo OTT platform, 
but nobody else uses Vimeo OTT, so I'm not going to bother.

Currently, this addon saves which subtitles are enabled, but not any of the fancy style options. 
This is because the Vimeo OTT API doesn't provide a way to get or set the style options. 
I might look into a way of doing this in the future.

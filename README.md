# Abfahrtsmonitor
I don't like the DVB website and app. So I'm building my own!
Also I'm german and terrible at finding names. If you have a better name for this project, please let me know!

Currently the website is usable, but still only contains very few functions of what is planned.
The long time goal is to build an alternative to m.dvb.de (which I don't like), including most of their features while adding a few features, that improve the user experience, especially when using a slow or unreliable internet connection.

## Current features:
* Shows nearby stations when location is activated
* Searching for stations is possible
* departure times can be shown for each station when selected in station list
* should be usable on mobile and desktop, regardless of the display size
* should be able to handle a bad internet connection better than m.dvb.de

## Planned features:
* showing connection details, including "what if you miss your bus"-feature that tells you when the next bus arrives
* listing connections for trip in a better way than m.dvb.de does
* totally remove server-part (which is currently php+mysql) and save everything in indexedDB for offline-access

### Planned features (meta):
* Adding Server-Config to repo without accidentally publishing my whole Nginx-Config while being able to change Nginx-Config from the repo
* Adding city to station-object (why did I not think of this before?)
* Improving search function to present the results in a somehow meaningful order
* Code documentation

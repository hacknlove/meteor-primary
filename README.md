# Primary / Secondary(s) cluster for Meteor

### Important: All the server instances must share the mongo database.**

just add this package `meter add hacknlove:primary` and you'll get:

### `Primary.serverId`
Just a runtime uuid for the server set at startup.
Next startup, it will have a diferent value.

### `Primary.isPrimary` and `Primary.isSecondary`
During the startup they could be both false, until someone is choosen Primary, so use them only at runtime, not at startup time.


### `Primary.becomePrimary(callback)` and `Primary.becomeSecondary(callback)`
You can call those as many times as you want, attaching a new callback each time.

They returns a function that if called, dettaches callback.

When a new Primary is choosen:
* The Secondary that becomes Primary, calls becomePrimary callbacks.
* The Primary that becomess Secondary, calls becomeSecondary callbacks.
* The Secondaries that remains Secondaries, calls nothing.

The callbacks receive as parameter a callable that if called, dettaches the callback.

### How it works:

Every server insert himself in the HacknlovePrimary collection with a timestamp

The one with the oldest Timestamp becomes Primary.

Every hearthbeat, the servers update their timestamp.

The Primary set his timestamp in the future (Now + hearthbeat - 1), in order to remain Primary.

So it does not change every time a new server is added to the cluster, and we do not want the primary to change randomly in each hearthbeat.

The timestamp olders than `hearthbeat * 4` are cleaned.

---
# Disclaimer:

This package is still beta, and it is not ready for production, nevertheless I am using it in production, but at my own risk.

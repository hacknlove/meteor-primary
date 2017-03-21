/* globals Mongo Meteor Primary:true */
/* exported Primary */

var onPrimarys = {}
var onSecondarys = {}

var call = function (what) {
  Object.keys(what).forEach(function (key) {
    what[key](function () {
      delete what[key]
    })
  })
}

Primary = {
  isPrimary: false,
  isSecondary: false,
  serverId: Meteor.uuid(),
  onPrimary: function (callback) {
    var key = Meteor.uuid()
    onPrimarys[key] = callback
    var offPrimary = function () {
      delete onPrimarys[key]
    }
    if (Primary.isPrimary) {
      callback(offPrimary)
    }
    return offPrimary
  },
  onSecondarys: function (callback) {
    var key = Meteor.uuid()
    onSecondarys[key] = callback
    var offSecondarys = function () {
      delete onSecondarys[key]
    }
    if (Primary.isSecondary) {
      callback(offSecondarys)
    }
    return offSecondarys
  }
}

var PrimaryDB = new Mongo.Collection('HacknlovePrimary')

var hearthbeat = 5000
if (Meteor.settings.private && Meteor.settings.private.Primary && Meteor.settings.private.Primary.hearthbeat) {
  hearthbeat = Meteor.settings.private.Primary.hearthbeat
}

PrimaryDB.insert({
  timestamp: Date.now() + hearthbeat / 2,
  serverId: Primary.serverId
})

PrimaryDB.find({}, {sort: {timestamp: -1}, limit: 1}).observeChanges({
  added: function (id, fields) {
    if (!Primary.isPrimary && fields.serverId === Primary.serverId) {
      Primary.isPrimary = true
      Primary.isSecondary = false
      call(onPrimarys)
      return
    }
    if (!Primary.isSecondary && fields.serverId !== Primary.serverId) {
      Primary.isPrimary = false
      Primary.isSecondary = true
      call(onSecondarys)
    }
  }
})

Meteor.setInterval(function () {
  if (Primary.isPrimary) {
    PrimaryDB.upsert({serverId: Primary.serverId}, {$set: {
      serverId: Primary.serverId,
      timestamp: Date.now() + hearthbeat * 1.5
    }})
  } else {
    PrimaryDB.upsert({serverId: Primary.serverId}, {$set: {
      serverId: Primary.serverId,
      timestamp: Date.now()
    }})
  }

  PrimaryDB.remove({timestamp: {$lt: Date.now() - hearthbeat * 4}})
}, hearthbeat)

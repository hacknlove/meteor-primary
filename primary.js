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
    return function () {
      delete onPrimarys[key]
    }
  },
  onSecondarys: function (callback) {
    var key = Meteor.uuid()
    onSecondarys[key] = callback
    return function () {
      delete onSecondarys[key]
    }
  }
}

var PrimaryDB = new Mongo.Collection('_Primary')

var hearthbeat = 1000
if (Meteor.settings.private.Primary && Meteor.settings.private.Primary.hearthbeat) {
  hearthbeat = Meteor.settings.private.Primary.hearthbeat
}

PrimaryDB.insert({
  timestamp: Date.now() + hearthbeat / 2,
  serverId: Primary.serverId
})

PrimaryDB.find({}, {sort: {timestamp: -1}, limit: 1}).observeChanges({
  added: function (id, fields) {
    if (Primary.isSecondary && fields.serverId === Primary.serverId) {
      Primary.isPrimary = true
      Primary.isSecondary = false
      call(onPrimarys)
      return
    }
    if (Primary.isPrimary && fields.serverId !== Primary.serverId) {
      Primary.isPrimary = false
      Primary.isSecondary = true
      call(onSecondarys)
    }
  }
})

Meteor.setInterval(function () {
  PrimaryDB.update({serverId: Primary.serverId}, {$set: {
    timestamp: Date.now() + (Primary.isPrimary ? 0 : (hearthbeat - 1))
  }})

  PrimaryDB.remove({timestamp: Date.now() - hearthbeat * 10})
}, hearthbeat)

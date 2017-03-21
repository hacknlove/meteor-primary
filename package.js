/* globals Package */

Package.describe({
  name: 'hacknlove:primary',
  version: '0.1.0',
  summary: 'Primary, Secondaries, cluster style ',
  git: '',
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom('1.4')
  api.use('ecmascript')
  api.use('mongo')
  api.addFiles('primary.js', 'server')
  api.export('Primary', 'server')
})

#!/usr/bin/env node
var fs = require('fs')
var path = require('path')
var mapval = require('map-values')
var mkdirp = require('mkdirp')
var argv = require('yargs')
  .usage('Usage: $0 instrument.json -o dir')
  .demand(1)
  .argv

publish(argv._[0], argv.o)

function publish (instrument, output) {
  var cwd = process.cwd()
  var configFile = path.join(cwd, instrument)
  var configDir = path.dirname(configFile)
  var config = JSON.parse(fs.readFileSync(configFile).toString())
  var samples = config.samples || 'samples/'
  var sampleDir = path.join(configDir, samples)
  var files = getAudioFiles(sampleDir)

  var encoded = mapval(files, function (val) {
    return encode(path.join(sampleDir, val))
  })

  if (output) {
    mkdirp.sync(path.join(cwd, output, config.name))
    var packFile = path.join(cwd, output, config.name, 'audio-pack.json')
    fs.writeFileSync(packFile, JSON.stringify(encoded, null, 2))
    var metaFile = path.join(cwd, output, config.name, 'meta-audio-pack.json')
    fs.writeFileSync(metaFile, JSON.stringify(meta(config, files), null, 2))
  } else {
    console.log(encoded)
  }
}

function meta (config, files) {
  var meta = Object.assign({}, config)
  meta.samples = files
  return meta
}

function getAudioFiles (path) {
  return fs.readdirSync(path).reduce(function (d, name) {
    var ext = isAudioFile(name)
    if (ext) d[name.substring(0, name.length - ext.length)] = name
    return d
  }, {})
}
/**
 * Return the extension of a filename if its a valid web audio format extension
 */
function isAudioFile (name) {
  var ext = path.extname(name)
  return ['.wav', '.ogg', '.mp3'].indexOf(ext) > -1 ? ext : null
}

/**
 * Encode an audio file using base64
 */
function encode (filename) {
  var ext = path.extname(filename)
  var data = fs.readFileSync(filename)
  var prefix = 'data:audio/' + ext.substring(1) + ';base64,'
  var encoded = new Buffer(data).toString('base64')
  return prefix + encoded
}

'use strict'

var path = require('path')
var Metalsmith = require('metalsmith')

module.exports = function pack (dir, published, packs) {
  Metalsmith(dir)
  .source(packs)
  .destination(path.join(dir, published))
  .clean(true)
  .use(plugin)
  .build(function (err) {
    if (err) throw err
    console.log('Completed!')
  })
}

function plugin (files, metalsmith, done) {
  var output = process(files)
  Object.keys(files).forEach(function (k) {
    delete files[k]
  })
  Object.keys(output).forEach(function (k) {
    files[k] = output[k]
  })
  done()
}

/**
 * Given an object with the input files, returns an object with the output files
 * @param {Object} input
 * @return {Object} output
 */
function process (input) {
  var output = {}
  Object.keys(input).forEach(function (fileName) {
    if (/instrument\.json$/.test(fileName)) {
      var name = fileName.slice(0, fileName.indexOf('/'))
      var packFiles = filter(isFromPack(name), input)
      var packOut = publish(name, packFiles)
      Object.assign(output, packOut)
    }
  })
  return output
}

function publish (name, files) {
  var output = {}
  var audioFiles = filter(isAudio(), files)
  var config = JSON.parse(files[name + '/instrument.json'].contents.toString())
  output[name + '/audio-pack.json'] = objToBuffer(buildPack(audioFiles))
  output[name + '/meta-audio-pack.json'] = objToBuffer(buildMeta(config, audioFiles))
  return output
}

var REPO = 'http://danigb.github.io/audio-pack/published/'
function buildMeta (config, audioFiles) {
  var meta = Object.assign({}, config)
  meta.samples = Object.keys(audioFiles).reduce(function (samples, path) {
    var filename = path.slice(path.lastIndexOf('/') + 1)
    var name = filename.slice(0, filename.lastIndexOf('.'))
    samples[name] = { file: filename, size: audioFiles[path].contents.length }
    return samples
  }, {})
  meta.repository = REPO + meta.name
  return meta
}

function objToBuffer (obj) {
  return { contents: new Buffer(JSON.stringify(obj, null, 2)) }
}

function buildPack (files) {
  var pack = {}
  var names = Object.keys(files)
  var shared = sharedStart(names)
  names.forEach(function (path) {
    var name = path.slice(shared.length, path.lastIndexOf('.'))
    var ext = path.slice(path.lastIndexOf('.') + 1)
    pack[name] = encode(ext, files[path].contents)
  })
  return pack
}

// http://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings/1917041#1917041
function sharedStart (array) {
  var sorted = array.concat().sort()
  var first = sorted[0]
  var last = sorted[sorted.length - 1]
  var len = first.length
  var i = 0
  while (i < len && first.charAt(i) === last.charAt(i)) i++
  return first.substring(0, i)
}

/**
 * Encode an audio file using base64
 */
function encode (ext, data) {
  var prefix = 'data:audio/' + ext + ';base64,'
  var encoded = data.toString('base64')
  return prefix + encoded
}

function isFromPack (pack) {
  return function (name) { return name.startsWith(pack) }
}
function isAudio () {
  return function (name) { return /\.(mp3|ogg|wav)$/.test(name) }
}

function filter (fn, files) {
  var filtered = {}
  Object.keys(files).forEach(function (fileName) {
    if (fn(fileName)) filtered[fileName] = files[fileName]
  })
  return filtered
}

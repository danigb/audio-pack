/* global AudioContext */
var ac = new AudioContext()
var load = require('audio-loader')
var snabbdom = require('snabbdom')
var patch = snabbdom.init([ // Init patch function with choosen modules
  require('snabbdom/modules/class'), // makes it easy to toggle classes
  require('snabbdom/modules/props'), // for setting properties on DOM elements
  require('snabbdom/modules/style'), // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners') // attaches event listeners
])
var h = require('snabbdom/h')

var container = document.getElementById('app')

// Actions
function None () { return { type: 'none ' } }
function LoadPack () { return { type: 'loadPack' } }
function PackLoaded (pack) { return { type: 'packLoaded', pack: pack } }

function init () {
  return { meta: window.PackInfo, samples: [] }
}

var model = init()

function update (model, action, send) {
  var m = Object.assign({}, model)
  console.log('update', action, m)
  switch (action.type) {
    case 'loadPack':
      load(ac, model.meta.pack).then(function (pack) {
        send(PackLoaded(pack))
      })
      return m
    case 'packLoaded':
      m.pack = action.pack
      m.samples = Object.keys(action.pack)
      return m
    default: return m
  }
}

function view (model) {
  return h('div', { }, [
    h('h3', {}, 'Samples'),
    h('div.samples', {}, viewSamples(model))
  ])
}

function viewSamples (model) {
  console.log('Render samples', model.samples)
  return model.samples.map(function (name) {
    return h('a.sample', {}, name)
  })
}

function app (container, model, action, update, view) {
  function send (action) {
    model = update(model, action, send)
    patch(vnode, view(model))
  }
  model = update(model, action, send)
  var vnode = view(model)
  patch(container, vnode)
}

app(container, model, LoadPack(), update, view)

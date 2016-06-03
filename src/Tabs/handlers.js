const util = require('../util')
const log = (...args) => util.log('tab', ...args)

const handlers = {
  onCreated({id, windowId}) {
    this.append(id, windowId)
  },
  onRemoved(tabId, {windowId}) {
    this.remove(tabId, windowId)
  },
  onDetached(tabId, {oldWindowId}) {
    this.remove(tabId, oldWindowId)
  },
  onAttached(tabId, {newWindowId}) {
    this.append(tabId, newWindowId)
  },
  onActivated({tabId, windowId}) {
    this.remove(tabId, windowId)
    this.prepend(tabId, windowId)
  },
  onReplaced(tabId, {addedTabId, removedTabId}) {
    log('replaced', {tabId, addedTabId, removedTabId})
  },
}

const debug = true
if (debug) {
  Object.entries(handlers).forEach(([k, fn]) => {
    handlers[k] = function(...args) {
      log(k, ...args)
      fn.apply(this, args)
    }
  })
}

module.exports = handlers

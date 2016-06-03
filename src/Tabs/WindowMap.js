const {CollectionMap} = require('CollectionMap')

const handlers = require('./handlers')
const {Window} = require('./Window')

class WindowMap extends CollectionMap {
  constructor(chromeTabs) {
    super(Window, 'size')
    Object.entries(this.handlers).forEach(([name, handler]) => {
      chromeTabs[name].addListener(handler.bind(this))
    })
  }
  update(method, tabId, windowId) {
    return this.set(windowId, this.get(windowId)[method](tabId))
  }
  append(tabId, windowId) {
    return this.update('append', tabId, windowId)
  }
  prepend(tabId, windowId) {
    return this.update('prepend', tabId, windowId)
  }
  remove(tabId, windowId) {
    return this.update('remove', tabId, windowId)
  }
  populate(tabs) {
    tabs.forEach(({id, windowId}) => this.append(id, windowId))
    return this
  }
}

Object.assign(WindowMap.prototype, {handlers})

module.exports = {WindowMap}

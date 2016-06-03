const {Circulator} = require('circulator')

class Window extends Circulator {
  prepend(tabId) {
    return new this.constructor([tabId].concat([...this]))
  }
  append(tabId) {
    return new this.constructor([...this].concat(tabId))
  }
  remove(tabId) {
    return new this.constructor([...this].filter(x => x !== tabId))
  }
}

module.exports = {Window}

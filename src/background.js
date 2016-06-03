Object.entries = require('object.entries')

const {log} = require('./util')
const {WindowMap} = require('./Tabs/WindowMap')

chrome = require('promiseproxy-chrome')(chrome)

const actions = {
  async remove() {
    if (!this.tab) return
    const newActiveId = await chrome.tabs.sendMessage(this.tab.id, 'close')
    chrome.tabs.update(newActiveId, {active: true})
    chrome.tabs.remove(this.tab.id)
    this.tab = null
  },
}
async function init() {
  window.windows = new WindowMap(chrome.tabs)
  const commands = await chrome.commands.getAll()
  windows.populate(await chrome.tabs.query({}))

  log('init', {commands, windows})

  chrome.runtime.onMessage.addListener((key, sender) => {
    actions.remove()
    log('message', key, sender)
  })

  chrome.commands.onCommand.addListener(async function(command) {
    if (actions.tab) {
      // Forward command
      chrome.tabs.sendMessage(actions.tab.id, command)
      return
    }
    const [{index}] = await chrome.tabs.query({
      currentWindow: true,
      active: true,
    })
    actions.tab = await chrome.tabs.create({
      url: chrome.extension.getURL(`switcher.html#${command}`),
      active: true,
      index: index + 1,
    })
    log('command', command)
  })
}

chrome.runtime.onStartup.addListener(init)
chrome.runtime.onInstalled.addListener(init)

/*
const modKeys = ['shift', 'alt', 'ctrl', 'meta']

function parseShortcut(text) {
  return text.split('+')
      .map(x => x.toLowerCase())
      .filter(x => modKeys.includes(x))
}
*/

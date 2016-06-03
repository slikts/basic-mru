const test = require('tape')
// const sinon = require('sinon')

const {WindowMap} = require('../src/Tabs/WindowMap')

const chrome = require('promiseproxy-chrome')(require('sinon-chrome'))

test('construct WindowMap', function (t) {
  const a = new WindowMap(chrome.tabs)
  chrome.tabs.onCreated.trigger({id: 1, windowId: 1})
  chrome.tabs.onCreated.trigger({id: 2, windowId: 1})
  chrome.tabs.onCreated.trigger({id: 3, windowId: 1})
  const w = () => a.get(1)
  t.equal(w().size, 3)
  t.deepEqual([1, 2, 3], [...w()])
  chrome.tabs.onActivated.trigger({tabId: 3, windowId: 1})
  t.deepEqual([3, 1, 2], [...w()])
  t.end()
})

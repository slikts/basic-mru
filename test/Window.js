'use strict'

const test = require('tape')

const {Window} = require('../src/Tabs/Window')

test('construct Window', function (t) {
  const a = new Window([1,2,3])
  t.deepEquals([1,2,3], [...a])
  t.end()
})

test('update', function (t) {
  let a = new Window([1,2,3])
  t.deepEquals([5, 1, 2, 3], [...a.prepend(5)])
  let b = new Window([1,2,3])
  t.deepEquals([1, 2, 3, 6], [...b.append(6)])
  t.end()
})

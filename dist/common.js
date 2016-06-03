require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({42:[function(require,module,exports){
'use strict';

let init = (() => {
  var ref = _asyncToGenerator(function* (skip = 0) {
    const bg = yield chrome.runtime.getBackgroundPage();
    const tabIds = bg.windows.get((yield chrome.windows.getCurrent()).id);
    const tabs = (yield Promise.all([...tabIds].map(function (id) {
      return chrome.tabs.get(id);
    }))).slice(skip);
    const dom = document.createRange().createContextualFragment(list(tabs));
    const cycle = new TabCycle(dom.querySelectorAll('.tab'));
    const tabMap = new Map(tabs.map(function (tab) {
      return [String(tab.id), tab];
    }));
    Array.from(dom.querySelectorAll('.placeholder')).forEach(function (el) {
      const { id, key } = el.dataset;
      el.textContent = tabMap.get(id)[key];
    });
    return { dom, cycle };
  });

  return function init(_x) {
    return ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const { Circulator } = require('circulator');

const cn = 'active';
class TabCycle extends Circulator {
  constructor(it) {
    super(it);
    this.current();
    const hash = location.hash.slice(1);
    if (this[hash]) {
      this[hash]();
      location.hash = '';
      history.pushState('', document.title, location.href.split('#')[0]);
    }
  }
  next() {
    this.current().classList.remove(cn);
    super.next().classList.add(cn);
  }
  prev() {
    this.current().classList.remove(cn);
    super.prev().classList.add(cn);
  }
}

chrome = require('promiseproxy-chrome')(chrome);

const placeholder = (id, key) => `<span class="placeholder" data-id="${ id }" data-key="${ key }"></span>`;
const item = ({ id, favIconUrl }) => `<li data-id="${ id }" class="tab">
  <h1 class="title"><img class="favicon" src="${ favIconUrl || '' }" width="16" height="16">${ placeholder(id, 'title') }</h1>
  <p class="url">${ placeholder(id, 'url') }</p>
</li>`;
const list = tabs => `<ol id="switcher">${ tabs.map(item).join('') }</ol>`;

addEventListener('keyup', e => {
  if (e.keyCode === 18) {
    chrome.runtime.sendMessage('switcher_mods_up');
  }
});

module.exports = init;

},{"circulator":2,"promiseproxy-chrome":32}],47:[function(require,module,exports){
'use strict';

const debug = true;

module.exports = {
  log: debug ? (...args) => {
    console.log('mru', ...args);return args[0];
  } : () => {}
};

},{}],32:[function(require,module,exports){
const {PromiseProxy} = require('promiseproxy')

const schema = require('./schema')

const ChromePromiseProxy = target => PromiseProxy(target, schema)

module.exports = ChromePromiseProxy

},{"./schema":33,"promiseproxy":34}],34:[function(require,module,exports){
const {CachedPromiseProxy} = require('./src')

module.exports = {
  PromiseProxy: CachedPromiseProxy,
}

},{"./src":36}],36:[function(require,module,exports){
const {PromiseProxy} = require('./promiseproxy')
const {CachedPromiseProxy} = require('./cached')

module.exports = {PromiseProxy, CachedPromiseProxy}

},{"./cached":35,"./promiseproxy":37}],35:[function(require,module,exports){
'use strict'

const {PromiseProxy} = require('./promiseproxy')

/** Wraps PromiseProxy factory and caches instances in a WeakMap */
function CachedPromiseProxy(target, context, cache = new WeakMap(), factory = PromiseProxy) {
  const cached = cache.get(target)
  if (cached) {
    return cached
  }
  const obj = factory(target, context,
    (target, context) => CachedPromiseProxy(target, context, cache))
  cache.set(target, obj)
  return obj
}

module.exports = {CachedPromiseProxy}

},{"./promiseproxy":37}],37:[function(require,module,exports){
'use strict'

const {insert} = require('./util')

/**
 * Factory of [`Proxy`][1] objects for recursively promisifying a callback-based API
 * @param {Object} target The API to be promisifed
 * @param {Object} schema API structure with callback parameter position
 * @return {Proxy}
 * @alias module:promiseproxy
 * @example
 * // Define chrome.tabs.query(_, callback) and .update(_, _, callback) methods
 * // 1 and 2 are the positions of the callback parameters (zero-based)
 * const schema = {tabs: {query: 1, update: 2}}
 * // Promisify the Chrome API based on the schema
 * const _chrome = PromiseProxy(chrome, schema)
 * // The promisified methods return a Promise if the callback parameter is omitted
 * _chrome.tabs.query(info).then(callback)
 * // The same methods can still be used with a callback
 * _chrome.tabs.query(info, callback)
 */
function PromiseProxy(target, schema, self = PromiseProxy) {
  const handler = {
    apply(method, receiver, args) {
      const index = schema
      if (args[index] != null) {
        return Reflect.apply(method, receiver, args)
      }
      return new Promise(resolve => Reflect.apply(method, receiver, insert(args, resolve, index)))
    },
    get(target, key) {
      const prop = target[key]
      if (schema.hasOwnProperty(key)) {
        return self(prop, schema[key])
      }
      return prop
    },
  }
  return new Proxy(target, handler)
}

/**
 * @module promiseproxy
 * @example
 * const {PromiseProxy} = require("promiseproxy")
 */
module.exports = {PromiseProxy}

},{"./util":38}],38:[function(require,module,exports){
'use strict'

module.exports = {
  insert: (arr, item, pos) => arr.slice(0, pos).concat([item], arr.slice(pos))
}

},{}],33:[function(require,module,exports){
/* Generated from api.json */
module.exports = {
  bookmarks: {
    get: 1,
    getChildren: 1,
    getRecent: 1,
    getTree: 0,
    getSubTree: 1,
    search: 1,
    create: 1,
    move: 2,
    update: 2,
    remove: 1,
    removeTree: 1
  },
  browserAction: {
    getTitle: 1,
    setIcon: 1,
    getPopup: 1,
    getBadgeText: 1,
    getBadgeBackgroundColor: 1
  },
  browsingData: {
    settings: 0,
    remove: 2,
    removeAppcache: 1,
    removeCache: 1,
    removeCookies: 1,
    removeDownloads: 1,
    removeFileSystems: 1,
    removeFormData: 1,
    removeHistory: 1,
    removeIndexedDB: 1,
    removeLocalStorage: 1,
    removePluginData: 1,
    removePasswords: 1,
    removeWebSQL: 1
  },
  commands: {
    getAll: 0
  },
  contextMenus: {
    create: 1,
    update: 2,
    remove: 1,
    removeAll: 0
  },
  cookies: {
    get: 1,
    getAll: 1,
    set: 1,
    remove: 1,
    getAllCookieStores: 0
  },
  debugger: {
    attach: 2,
    detach: 1,
    sendCommand: 3,
    getTargets: 0
  },
  desktopCapture: {
    chooseDesktopMedia: 2
  },
  devtools: {
    inspectedWindow: {
      eval: 2,
      getResources: 0
    },
    network: {
      getHAR: 0
    },
    panels: {
      create: 3,
      setOpenResourceHandler: 0,
      openResource: 2
    }
  },
  documentScan: {
    scan: 1
  },
  downloads: {
    download: 1,
    search: 1,
    pause: 1,
    resume: 1,
    cancel: 1,
    getFileIcon: 2,
    erase: 1,
    removeFile: 1,
    acceptDanger: 1
  },
  extension: {
    sendRequest: 2,
    isAllowedIncognitoAccess: 0,
    isAllowedFileSchemeAccess: 0
  },
  fontSettings: {
    clearFont: 1,
    getFont: 1,
    setFont: 1,
    getFontList: 0,
    clearDefaultFontSize: 1,
    getDefaultFontSize: 1,
    setDefaultFontSize: 1,
    clearDefaultFixedFontSize: 1,
    getDefaultFixedFontSize: 1,
    setDefaultFixedFontSize: 1,
    clearMinimumFontSize: 1,
    getMinimumFontSize: 1,
    setMinimumFontSize: 1
  },
  gcm: {
    register: 1,
    unregister: 0,
    send: 1
  },
  history: {
    search: 1,
    getVisits: 1,
    addUrl: 1,
    deleteUrl: 1,
    deleteRange: 1,
    deleteAll: 0
  },
  i18n: {
    getAcceptLanguages: 0,
    detectLanguage: 1
  },
  identity: {
    getAccounts: 0,
    getAuthToken: 1,
    getProfileUserInfo: 0,
    removeCachedAuthToken: 1,
    launchWebAuthFlow: 1
  },
  idle: {
    queryState: 1
  },
  input: {
    ime: {
      setComposition: 1,
      clearComposition: 1,
      commitText: 1,
      sendKeyEvents: 1,
      setCandidateWindowProperties: 1,
      setCandidates: 1,
      setCursorPosition: 1,
      setMenuItems: 1,
      updateMenuItems: 1,
      deleteSurroundingText: 1
    }
  },
  management: {
    getAll: 0,
    get: 1,
    getSelf: 0,
    getPermissionWarningsById: 1,
    getPermissionWarningsByManifest: 1,
    setEnabled: 2,
    uninstall: 2,
    uninstallSelf: 1,
    launchApp: 1,
    createAppShortcut: 1,
    setLaunchType: 2,
    generateAppForLink: 2
  },
  notifications: {
    create: 2,
    update: 2,
    clear: 1,
    getAll: 0,
    getPermissionLevel: 0
  },
  pageAction: {
    getTitle: 1,
    setIcon: 1,
    getPopup: 1
  },
  pageCapture: {
    saveAsMHTML: 1
  },
  permissions: {
    getAll: 0,
    contains: 1,
    request: 1,
    remove: 1
  },
  runtime: {
    getBackgroundPage: 0,
    openOptionsPage: 0,
    setUninstallURL: 1,
    requestUpdateCheck: 0,
    sendMessage: 3,
    sendNativeMessage: 2,
    getPlatformInfo: 0,
    getPackageDirectoryEntry: 0
  },
  sessions: {
    getRecentlyClosed: 1,
    getDevices: 1,
    restore: 1
  },
  system: {
    cpu: {
      getInfo: 0
    },
    memory: {
      getInfo: 0
    },
    storage: {
      getInfo: 0,
      ejectDevice: 1,
      getAvailableCapacity: 1
    }
  },
  tabCapture: {
    capture: 1,
    getCapturedTabs: 0
  },
  tabs: {
    get: 1,
    getCurrent: 0,
    sendRequest: 2,
    sendMessage: 3,
    getSelected: 1,
    getAllInWindow: 1,
    create: 1,
    duplicate: 1,
    query: 1,
    highlight: 1,
    update: 2,
    move: 2,
    reload: 2,
    remove: 1,
    detectLanguage: 1,
    captureVisibleTab: 2,
    executeScript: 2,
    insertCSS: 2,
    setZoom: 2,
    getZoom: 1,
    setZoomSettings: 2,
    getZoomSettings: 1
  },
  topSites: {
    get: 0
  },
  tts: {
    speak: 2,
    isSpeaking: 0,
    getVoices: 0
  },
  webNavigation: {
    getFrame: 1,
    getAllFrames: 1
  },
  webRequest: {
    handlerBehaviorChanged: 0
  },
  webstore: {
    install: 1
  },
  windows: {
    get: 2,
    getCurrent: 1,
    getLastFocused: 1,
    getAll: 1,
    create: 1,
    update: 2,
    remove: 1
  },
  alarms: {
    get: 1,
    getAll: 0,
    clear: 1,
    clearAll: 0
  },
  platformKeys: {
    selectClientCertificates: 1,
    getKeyPair: 2,
    verifyTLSServerCertificate: 1
  }
}

},{}],2:[function(require,module,exports){
const cycle = require('./lib/cycle')
const {Circulator} = require('./lib/Circulator')

module.exports = {cycle, Circulator}

},{"./lib/Circulator":3,"./lib/cycle":4}],3:[function(require,module,exports){
'use strict'

const cycle = require('./cycle')

class Circulator {
  /**
   * Wrap an iterable and allow cycling its elements infinitely
   * @param  {Iterable} iterable Iterable to cycle
   * @return {Circulator}
   */
  constructor(iterable) {
    const arr = iterable ? Array.from(iterable) : []
    this.size = arr.length
    this.cycle = cycle(arr)
    // Init newborn generator
    this.cycle.next()
  }
  *[Symbol.iterator]() {
    // Same as return arr[Symbol.iterator]()
    yield* Array.from(Array(this.size), (_, i) => this.step(+!!i))
    // Reset to start
    this.next()
  }
  /**
   * Step through the cycle
   * @param  {number} n Number of steps
   * @return {}
   */
  step(n) {
    return this.cycle.next(n).value
  }
  current() {
    return this.step(0)
  }
  prev() {
    return this.step(-1)
  }
  next() {
    return this.step(1)
  }
}

module.exports = {Circulator}

},{"./cycle":4}],4:[function(require,module,exports){
'use strict'
/* eslint-disable no-constant-condition */

/**
 * Generator for cycling an array in both directions
 * @param  {Array} arr
 * @return {Generator}
 */
function* cycle(arr) {
  let i = 0
  while (true) {
    i = (arr.length + i + (yield arr[i])) % arr.length
  }
}

module.exports = cycle

},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcX3N3aXRjaGVyLmpzIiwic3JjXFx1dGlsLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2Vwcm94eS1jaHJvbWUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZXByb3h5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2Vwcm94eS9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZXByb3h5L3NyYy9jYWNoZWQuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZXByb3h5L3NyYy9wcm9taXNlcHJveHkuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZXByb3h5L3NyYy91dGlsLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2Vwcm94eS1jaHJvbWUvc2NoZW1hLmpzIiwibm9kZV9tb2R1bGVzL2NpcmN1bGF0b3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2lyY3VsYXRvci9saWIvQ2lyY3VsYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9jaXJjdWxhdG9yL2xpYi9jeWNsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs4QkNpQ0EsV0FBb0IsT0FBTyxDQUEzQixFQUE4QjtBQUM1QixVQUFNLEtBQUssTUFBTSxPQUFPLE9BQVAsQ0FBZSxpQkFBZixFQUFqQjtBQUNBLFVBQU0sU0FBUyxHQUFHLE9BQUgsQ0FBVyxHQUFYLENBQWUsQ0FBQyxNQUFNLE9BQU8sT0FBUCxDQUFlLFVBQWYsRUFBUCxFQUFvQyxFQUFuRCxDQUFmO0FBQ0EsVUFBTSxPQUFPLENBQUMsTUFBTSxRQUFRLEdBQVIsQ0FBWSxDQUFDLEdBQUcsTUFBSixFQUFZLEdBQVosQ0FBZ0I7QUFBQSxhQUFNLE9BQU8sSUFBUCxDQUFZLEdBQVosQ0FBZ0IsRUFBaEIsQ0FBTjtBQUFBLEtBQWhCLENB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3Qge0NpcmN1bGF0b3J9ID0gcmVxdWlyZSgnY2lyY3VsYXRvcicpXG5cbmNvbnN0IGNuID0gJ2FjdGl2ZSdcbmNsYXNzIFRhYkN5Y2xlIGV4dGVuZHMgQ2lyY3VsYXRvciB7XG4gIGNvbnN0cnVjdG9yKGl0KSB7XG4gICAgc3VwZXIoaXQpXG4gICAgdGhpcy5jdXJyZW50KClcbiAgICBjb25zdCBoYXNoID0gbG9jYXRpb24uaGFzaC5zbGljZSgxKVxuICAgIGlmICh0aGlzW2hhc2hdKSB7XG4gICAgICB0aGlzW2hhc2hdKClcbiAgICAgIGxvY2F0aW9uLmhhc2ggPSAnJ1xuICAgICAgaGlzdG9yeS5wdXNoU3RhdGUoJycsIGRvY3VtZW50LnRpdGxlLCBsb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0pXG4gICAgfVxuICB9XG4gIG5leHQoKSB7XG4gICAgdGhpcy5jdXJyZW50KCkuY2xhc3NMaXN0LnJlbW92ZShjbilcbiAgICBzdXBlci5uZXh0KCkuY2xhc3NMaXN0LmFkZChjbilcbiAgfVxuICBwcmV2KCkge1xuICAgIHRoaXMuY3VycmVudCgpLmNsYXNzTGlzdC5yZW1vdmUoY24pXG4gICAgc3VwZXIucHJldigpLmNsYXNzTGlzdC5hZGQoY24pXG4gIH1cbn1cblxuY2hyb21lID0gcmVxdWlyZSgncHJvbWlzZXByb3h5LWNocm9tZScpKGNocm9tZSlcblxuY29uc3QgcGxhY2Vob2xkZXIgPSAoaWQsIGtleSkgPT4gYDxzcGFuIGNsYXNzPVwicGxhY2Vob2xkZXJcIiBkYXRhLWlkPVwiJHtpZH1cIiBkYXRhLWtleT1cIiR7a2V5fVwiPjwvc3Bhbj5gXG5jb25zdCBpdGVtID0gKHtpZCwgZmF2SWNvblVybH0pID0+IGA8bGkgZGF0YS1pZD1cIiR7aWR9XCIgY2xhc3M9XCJ0YWJcIj5cbiAgPGgxIGNsYXNzPVwidGl0bGVcIj48aW1nIGNsYXNzPVwiZmF2aWNvblwiIHNyYz1cIiR7ZmF2SWNvblVybCB8fCAnJ31cIiB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIj4ke3BsYWNlaG9sZGVyKGlkLCAndGl0bGUnKX08L2gxPlxuICA8cCBjbGFzcz1cInVybFwiPiR7cGxhY2Vob2xkZXIoaWQsICd1cmwnKX08L3A+XG48L2xpPmBcbmNvbnN0IGxpc3QgPSB0YWJzID0+IGA8b2wgaWQ9XCJzd2l0Y2hlclwiPiR7dGFicy5tYXAoaXRlbSkuam9pbignJyl9PC9vbD5gXG5cbmFzeW5jIGZ1bmN0aW9uIGluaXQoc2tpcCA9IDApIHtcbiAgY29uc3QgYmcgPSBhd2FpdCBjaHJvbWUucnVudGltZS5nZXRCYWNrZ3JvdW5kUGFnZSgpXG4gIGNvbnN0IHRhYklkcyA9IGJnLndpbmRvd3MuZ2V0KChhd2FpdCBjaHJvbWUud2luZG93cy5nZXRDdXJyZW50KCkpLmlkKVxuICBjb25zdCB0YWJzID0gKGF3YWl0IFByb21pc2UuYWxsKFsuLi50YWJJZHNdLm1hcChpZCA9PiBjaHJvbWUudGFicy5nZXQoaWQpKSkpLnNsaWNlKHNraXApXG4gIGNvbnN0IGRvbSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCkuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KGxpc3QodGFicykpXG4gIGNvbnN0IGN5Y2xlID0gbmV3IFRhYkN5Y2xlKGRvbS5xdWVyeVNlbGVjdG9yQWxsKCcudGFiJykpXG4gIGNvbnN0IHRhYk1hcCA9IG5ldyBNYXAodGFicy5tYXAodGFiID0+IFtTdHJpbmcodGFiLmlkKSwgdGFiXSkpXG4gIEFycmF5LmZyb20oZG9tLnF1ZXJ5U2VsZWN0b3JBbGwoJy5wbGFjZWhvbGRlcicpKS5mb3JFYWNoKGVsID0+IHtcbiAgICBjb25zdCB7aWQsIGtleX0gPSBlbC5kYXRhc2V0XG4gICAgZWwudGV4dENvbnRlbnQgPSB0YWJNYXAuZ2V0KGlkKVtrZXldXG4gIH0pXG4gIHJldHVybiB7ZG9tLCBjeWNsZX1cbn1cblxuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBlID0+IHtcbiAgaWYgKGUua2V5Q29kZSA9PT0gMTgpICB7XG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoJ3N3aXRjaGVyX21vZHNfdXAnKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRcbiIsImNvbnN0IGRlYnVnID0gdHJ1ZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbG9nOiBkZWJ1ZyA/ICguLi5hcmdzKSA9PiB7IGNvbnNvbGUubG9nKCdtcnUnLCAuLi5hcmdzKTsgcmV0dXJuIGFyZ3NbMF0gfSA6ICgpID0+IHt9LFxufVxuIiwiY29uc3Qge1Byb21pc2VQcm94eX0gPSByZXF1aXJlKCdwcm9taXNlcHJveHknKVxuXG5jb25zdCBzY2hlbWEgPSByZXF1aXJlKCcuL3NjaGVtYScpXG5cbmNvbnN0IENocm9tZVByb21pc2VQcm94eSA9IHRhcmdldCA9PiBQcm9taXNlUHJveHkodGFyZ2V0LCBzY2hlbWEpXG5cbm1vZHVsZS5leHBvcnRzID0gQ2hyb21lUHJvbWlzZVByb3h5XG4iLCJjb25zdCB7Q2FjaGVkUHJvbWlzZVByb3h5fSA9IHJlcXVpcmUoJy4vc3JjJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFByb21pc2VQcm94eTogQ2FjaGVkUHJvbWlzZVByb3h5LFxufVxuIiwiY29uc3Qge1Byb21pc2VQcm94eX0gPSByZXF1aXJlKCcuL3Byb21pc2Vwcm94eScpXG5jb25zdCB7Q2FjaGVkUHJvbWlzZVByb3h5fSA9IHJlcXVpcmUoJy4vY2FjaGVkJylcblxubW9kdWxlLmV4cG9ydHMgPSB7UHJvbWlzZVByb3h5LCBDYWNoZWRQcm9taXNlUHJveHl9XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3Qge1Byb21pc2VQcm94eX0gPSByZXF1aXJlKCcuL3Byb21pc2Vwcm94eScpXG5cbi8qKiBXcmFwcyBQcm9taXNlUHJveHkgZmFjdG9yeSBhbmQgY2FjaGVzIGluc3RhbmNlcyBpbiBhIFdlYWtNYXAgKi9cbmZ1bmN0aW9uIENhY2hlZFByb21pc2VQcm94eSh0YXJnZXQsIGNvbnRleHQsIGNhY2hlID0gbmV3IFdlYWtNYXAoKSwgZmFjdG9yeSA9IFByb21pc2VQcm94eSkge1xuICBjb25zdCBjYWNoZWQgPSBjYWNoZS5nZXQodGFyZ2V0KVxuICBpZiAoY2FjaGVkKSB7XG4gICAgcmV0dXJuIGNhY2hlZFxuICB9XG4gIGNvbnN0IG9iaiA9IGZhY3RvcnkodGFyZ2V0LCBjb250ZXh0LFxuICAgICh0YXJnZXQsIGNvbnRleHQpID0+IENhY2hlZFByb21pc2VQcm94eSh0YXJnZXQsIGNvbnRleHQsIGNhY2hlKSlcbiAgY2FjaGUuc2V0KHRhcmdldCwgb2JqKVxuICByZXR1cm4gb2JqXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge0NhY2hlZFByb21pc2VQcm94eX1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB7aW5zZXJ0fSA9IHJlcXVpcmUoJy4vdXRpbCcpXG5cbi8qKlxuICogRmFjdG9yeSBvZiBbYFByb3h5YF1bMV0gb2JqZWN0cyBmb3IgcmVjdXJzaXZlbHkgcHJvbWlzaWZ5aW5nIGEgY2FsbGJhY2stYmFzZWQgQVBJXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0IFRoZSBBUEkgdG8gYmUgcHJvbWlzaWZlZFxuICogQHBhcmFtIHtPYmplY3R9IHNjaGVtYSBBUEkgc3RydWN0dXJlIHdpdGggY2FsbGJhY2sgcGFyYW1ldGVyIHBvc2l0aW9uXG4gKiBAcmV0dXJuIHtQcm94eX1cbiAqIEBhbGlhcyBtb2R1bGU6cHJvbWlzZXByb3h5XG4gKiBAZXhhbXBsZVxuICogLy8gRGVmaW5lIGNocm9tZS50YWJzLnF1ZXJ5KF8sIGNhbGxiYWNrKSBhbmQgLnVwZGF0ZShfLCBfLCBjYWxsYmFjaykgbWV0aG9kc1xuICogLy8gMSBhbmQgMiBhcmUgdGhlIHBvc2l0aW9ucyBvZiB0aGUgY2FsbGJhY2sgcGFyYW1ldGVycyAoemVyby1iYXNlZClcbiAqIGNvbnN0IHNjaGVtYSA9IHt0YWJzOiB7cXVlcnk6IDEsIHVwZGF0ZTogMn19XG4gKiAvLyBQcm9taXNpZnkgdGhlIENocm9tZSBBUEkgYmFzZWQgb24gdGhlIHNjaGVtYVxuICogY29uc3QgX2Nocm9tZSA9IFByb21pc2VQcm94eShjaHJvbWUsIHNjaGVtYSlcbiAqIC8vIFRoZSBwcm9taXNpZmllZCBtZXRob2RzIHJldHVybiBhIFByb21pc2UgaWYgdGhlIGNhbGxiYWNrIHBhcmFtZXRlciBpcyBvbWl0dGVkXG4gKiBfY2hyb21lLnRhYnMucXVlcnkoaW5mbykudGhlbihjYWxsYmFjaylcbiAqIC8vIFRoZSBzYW1lIG1ldGhvZHMgY2FuIHN0aWxsIGJlIHVzZWQgd2l0aCBhIGNhbGxiYWNrXG4gKiBfY2hyb21lLnRhYnMucXVlcnkoaW5mbywgY2FsbGJhY2spXG4gKi9cbmZ1bmN0aW9uIFByb21pc2VQcm94eSh0YXJnZXQsIHNjaGVtYSwgc2VsZiA9IFByb21pc2VQcm94eSkge1xuICBjb25zdCBoYW5kbGVyID0ge1xuICAgIGFwcGx5KG1ldGhvZCwgcmVjZWl2ZXIsIGFyZ3MpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gc2NoZW1hXG4gICAgICBpZiAoYXJnc1tpbmRleF0gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseShtZXRob2QsIHJlY2VpdmVyLCBhcmdzKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gUmVmbGVjdC5hcHBseShtZXRob2QsIHJlY2VpdmVyLCBpbnNlcnQoYXJncywgcmVzb2x2ZSwgaW5kZXgpKSlcbiAgICB9LFxuICAgIGdldCh0YXJnZXQsIGtleSkge1xuICAgICAgY29uc3QgcHJvcCA9IHRhcmdldFtrZXldXG4gICAgICBpZiAoc2NoZW1hLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYocHJvcCwgc2NoZW1hW2tleV0pXG4gICAgICB9XG4gICAgICByZXR1cm4gcHJvcFxuICAgIH0sXG4gIH1cbiAgcmV0dXJuIG5ldyBQcm94eSh0YXJnZXQsIGhhbmRsZXIpXG59XG5cbi8qKlxuICogQG1vZHVsZSBwcm9taXNlcHJveHlcbiAqIEBleGFtcGxlXG4gKiBjb25zdCB7UHJvbWlzZVByb3h5fSA9IHJlcXVpcmUoXCJwcm9taXNlcHJveHlcIilcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7UHJvbWlzZVByb3h5fVxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbnNlcnQ6IChhcnIsIGl0ZW0sIHBvcykgPT4gYXJyLnNsaWNlKDAsIHBvcykuY29uY2F0KFtpdGVtXSwgYXJyLnNsaWNlKHBvcykpXG59XG4iLCIvKiBHZW5lcmF0ZWQgZnJvbSBhcGkuanNvbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJvb2ttYXJrczoge1xuICAgIGdldDogMSxcbiAgICBnZXRDaGlsZHJlbjogMSxcbiAgICBnZXRSZWNlbnQ6IDEsXG4gICAgZ2V0VHJlZTogMCxcbiAgICBnZXRTdWJUcmVlOiAxLFxuICAgIHNlYXJjaDogMSxcbiAgICBjcmVhdGU6IDEsXG4gICAgbW92ZTogMixcbiAgICB1cGRhdGU6IDIsXG4gICAgcmVtb3ZlOiAxLFxuICAgIHJlbW92ZVRyZWU6IDFcbiAgfSxcbiAgYnJvd3NlckFjdGlvbjoge1xuICAgIGdldFRpdGxlOiAxLFxuICAgIHNldEljb246IDEsXG4gICAgZ2V0UG9wdXA6IDEsXG4gICAgZ2V0QmFkZ2VUZXh0OiAxLFxuICAgIGdldEJhZGdlQmFja2dyb3VuZENvbG9yOiAxXG4gIH0sXG4gIGJyb3dzaW5nRGF0YToge1xuICAgIHNldHRpbmdzOiAwLFxuICAgIHJlbW92ZTogMixcbiAgICByZW1vdmVBcHBjYWNoZTogMSxcbiAgICByZW1vdmVDYWNoZTogMSxcbiAgICByZW1vdmVDb29raWVzOiAxLFxuICAgIHJlbW92ZURvd25sb2FkczogMSxcbiAgICByZW1vdmVGaWxlU3lzdGVtczogMSxcbiAgICByZW1vdmVGb3JtRGF0YTogMSxcbiAgICByZW1vdmVIaXN0b3J5OiAxLFxuICAgIHJlbW92ZUluZGV4ZWREQjogMSxcbiAgICByZW1vdmVMb2NhbFN0b3JhZ2U6IDEsXG4gICAgcmVtb3ZlUGx1Z2luRGF0YTogMSxcbiAgICByZW1vdmVQYXNzd29yZHM6IDEsXG4gICAgcmVtb3ZlV2ViU1FMOiAxXG4gIH0sXG4gIGNvbW1hbmRzOiB7XG4gICAgZ2V0QWxsOiAwXG4gIH0sXG4gIGNvbnRleHRNZW51czoge1xuICAgIGNyZWF0ZTogMSxcbiAgICB1cGRhdGU6IDIsXG4gICAgcmVtb3ZlOiAxLFxuICAgIHJlbW92ZUFsbDogMFxuICB9LFxuICBjb29raWVzOiB7XG4gICAgZ2V0OiAxLFxuICAgIGdldEFsbDogMSxcbiAgICBzZXQ6IDEsXG4gICAgcmVtb3ZlOiAxLFxuICAgIGdldEFsbENvb2tpZVN0b3JlczogMFxuICB9LFxuICBkZWJ1Z2dlcjoge1xuICAgIGF0dGFjaDogMixcbiAgICBkZXRhY2g6IDEsXG4gICAgc2VuZENvbW1hbmQ6IDMsXG4gICAgZ2V0VGFyZ2V0czogMFxuICB9LFxuICBkZXNrdG9wQ2FwdHVyZToge1xuICAgIGNob29zZURlc2t0b3BNZWRpYTogMlxuICB9LFxuICBkZXZ0b29sczoge1xuICAgIGluc3BlY3RlZFdpbmRvdzoge1xuICAgICAgZXZhbDogMixcbiAgICAgIGdldFJlc291cmNlczogMFxuICAgIH0sXG4gICAgbmV0d29yazoge1xuICAgICAgZ2V0SEFSOiAwXG4gICAgfSxcbiAgICBwYW5lbHM6IHtcbiAgICAgIGNyZWF0ZTogMyxcbiAgICAgIHNldE9wZW5SZXNvdXJjZUhhbmRsZXI6IDAsXG4gICAgICBvcGVuUmVzb3VyY2U6IDJcbiAgICB9XG4gIH0sXG4gIGRvY3VtZW50U2Nhbjoge1xuICAgIHNjYW46IDFcbiAgfSxcbiAgZG93bmxvYWRzOiB7XG4gICAgZG93bmxvYWQ6IDEsXG4gICAgc2VhcmNoOiAxLFxuICAgIHBhdXNlOiAxLFxuICAgIHJlc3VtZTogMSxcbiAgICBjYW5jZWw6IDEsXG4gICAgZ2V0RmlsZUljb246IDIsXG4gICAgZXJhc2U6IDEsXG4gICAgcmVtb3ZlRmlsZTogMSxcbiAgICBhY2NlcHREYW5nZXI6IDFcbiAgfSxcbiAgZXh0ZW5zaW9uOiB7XG4gICAgc2VuZFJlcXVlc3Q6IDIsXG4gICAgaXNBbGxvd2VkSW5jb2duaXRvQWNjZXNzOiAwLFxuICAgIGlzQWxsb3dlZEZpbGVTY2hlbWVBY2Nlc3M6IDBcbiAgfSxcbiAgZm9udFNldHRpbmdzOiB7XG4gICAgY2xlYXJGb250OiAxLFxuICAgIGdldEZvbnQ6IDEsXG4gICAgc2V0Rm9udDogMSxcbiAgICBnZXRGb250TGlzdDogMCxcbiAgICBjbGVhckRlZmF1bHRGb250U2l6ZTogMSxcbiAgICBnZXREZWZhdWx0Rm9udFNpemU6IDEsXG4gICAgc2V0RGVmYXVsdEZvbnRTaXplOiAxLFxuICAgIGNsZWFyRGVmYXVsdEZpeGVkRm9udFNpemU6IDEsXG4gICAgZ2V0RGVmYXVsdEZpeGVkRm9udFNpemU6IDEsXG4gICAgc2V0RGVmYXVsdEZpeGVkRm9udFNpemU6IDEsXG4gICAgY2xlYXJNaW5pbXVtRm9udFNpemU6IDEsXG4gICAgZ2V0TWluaW11bUZvbnRTaXplOiAxLFxuICAgIHNldE1pbmltdW1Gb250U2l6ZTogMVxuICB9LFxuICBnY206IHtcbiAgICByZWdpc3RlcjogMSxcbiAgICB1bnJlZ2lzdGVyOiAwLFxuICAgIHNlbmQ6IDFcbiAgfSxcbiAgaGlzdG9yeToge1xuICAgIHNlYXJjaDogMSxcbiAgICBnZXRWaXNpdHM6IDEsXG4gICAgYWRkVXJsOiAxLFxuICAgIGRlbGV0ZVVybDogMSxcbiAgICBkZWxldGVSYW5nZTogMSxcbiAgICBkZWxldGVBbGw6IDBcbiAgfSxcbiAgaTE4bjoge1xuICAgIGdldEFjY2VwdExhbmd1YWdlczogMCxcbiAgICBkZXRlY3RMYW5ndWFnZTogMVxuICB9LFxuICBpZGVudGl0eToge1xuICAgIGdldEFjY291bnRzOiAwLFxuICAgIGdldEF1dGhUb2tlbjogMSxcbiAgICBnZXRQcm9maWxlVXNlckluZm86IDAsXG4gICAgcmVtb3ZlQ2FjaGVkQXV0aFRva2VuOiAxLFxuICAgIGxhdW5jaFdlYkF1dGhGbG93OiAxXG4gIH0sXG4gIGlkbGU6IHtcbiAgICBxdWVyeVN0YXRlOiAxXG4gIH0sXG4gIGlucHV0OiB7XG4gICAgaW1lOiB7XG4gICAgICBzZXRDb21wb3NpdGlvbjogMSxcbiAgICAgIGNsZWFyQ29tcG9zaXRpb246IDEsXG4gICAgICBjb21taXRUZXh0OiAxLFxuICAgICAgc2VuZEtleUV2ZW50czogMSxcbiAgICAgIHNldENhbmRpZGF0ZVdpbmRvd1Byb3BlcnRpZXM6IDEsXG4gICAgICBzZXRDYW5kaWRhdGVzOiAxLFxuICAgICAgc2V0Q3Vyc29yUG9zaXRpb246IDEsXG4gICAgICBzZXRNZW51SXRlbXM6IDEsXG4gICAgICB1cGRhdGVNZW51SXRlbXM6IDEsXG4gICAgICBkZWxldGVTdXJyb3VuZGluZ1RleHQ6IDFcbiAgICB9XG4gIH0sXG4gIG1hbmFnZW1lbnQ6IHtcbiAgICBnZXRBbGw6IDAsXG4gICAgZ2V0OiAxLFxuICAgIGdldFNlbGY6IDAsXG4gICAgZ2V0UGVybWlzc2lvbldhcm5pbmdzQnlJZDogMSxcbiAgICBnZXRQZXJtaXNzaW9uV2FybmluZ3NCeU1hbmlmZXN0OiAxLFxuICAgIHNldEVuYWJsZWQ6IDIsXG4gICAgdW5pbnN0YWxsOiAyLFxuICAgIHVuaW5zdGFsbFNlbGY6IDEsXG4gICAgbGF1bmNoQXBwOiAxLFxuICAgIGNyZWF0ZUFwcFNob3J0Y3V0OiAxLFxuICAgIHNldExhdW5jaFR5cGU6IDIsXG4gICAgZ2VuZXJhdGVBcHBGb3JMaW5rOiAyXG4gIH0sXG4gIG5vdGlmaWNhdGlvbnM6IHtcbiAgICBjcmVhdGU6IDIsXG4gICAgdXBkYXRlOiAyLFxuICAgIGNsZWFyOiAxLFxuICAgIGdldEFsbDogMCxcbiAgICBnZXRQZXJtaXNzaW9uTGV2ZWw6IDBcbiAgfSxcbiAgcGFnZUFjdGlvbjoge1xuICAgIGdldFRpdGxlOiAxLFxuICAgIHNldEljb246IDEsXG4gICAgZ2V0UG9wdXA6IDFcbiAgfSxcbiAgcGFnZUNhcHR1cmU6IHtcbiAgICBzYXZlQXNNSFRNTDogMVxuICB9LFxuICBwZXJtaXNzaW9uczoge1xuICAgIGdldEFsbDogMCxcbiAgICBjb250YWluczogMSxcbiAgICByZXF1ZXN0OiAxLFxuICAgIHJlbW92ZTogMVxuICB9LFxuICBydW50aW1lOiB7XG4gICAgZ2V0QmFja2dyb3VuZFBhZ2U6IDAsXG4gICAgb3Blbk9wdGlvbnNQYWdlOiAwLFxuICAgIHNldFVuaW5zdGFsbFVSTDogMSxcbiAgICByZXF1ZXN0VXBkYXRlQ2hlY2s6IDAsXG4gICAgc2VuZE1lc3NhZ2U6IDMsXG4gICAgc2VuZE5hdGl2ZU1lc3NhZ2U6IDIsXG4gICAgZ2V0UGxhdGZvcm1JbmZvOiAwLFxuICAgIGdldFBhY2thZ2VEaXJlY3RvcnlFbnRyeTogMFxuICB9LFxuICBzZXNzaW9uczoge1xuICAgIGdldFJlY2VudGx5Q2xvc2VkOiAxLFxuICAgIGdldERldmljZXM6IDEsXG4gICAgcmVzdG9yZTogMVxuICB9LFxuICBzeXN0ZW06IHtcbiAgICBjcHU6IHtcbiAgICAgIGdldEluZm86IDBcbiAgICB9LFxuICAgIG1lbW9yeToge1xuICAgICAgZ2V0SW5mbzogMFxuICAgIH0sXG4gICAgc3RvcmFnZToge1xuICAgICAgZ2V0SW5mbzogMCxcbiAgICAgIGVqZWN0RGV2aWNlOiAxLFxuICAgICAgZ2V0QXZhaWxhYmxlQ2FwYWNpdHk6IDFcbiAgICB9XG4gIH0sXG4gIHRhYkNhcHR1cmU6IHtcbiAgICBjYXB0dXJlOiAxLFxuICAgIGdldENhcHR1cmVkVGFiczogMFxuICB9LFxuICB0YWJzOiB7XG4gICAgZ2V0OiAxLFxuICAgIGdldEN1cnJlbnQ6IDAsXG4gICAgc2VuZFJlcXVlc3Q6IDIsXG4gICAgc2VuZE1lc3NhZ2U6IDMsXG4gICAgZ2V0U2VsZWN0ZWQ6IDEsXG4gICAgZ2V0QWxsSW5XaW5kb3c6IDEsXG4gICAgY3JlYXRlOiAxLFxuICAgIGR1cGxpY2F0ZTogMSxcbiAgICBxdWVyeTogMSxcbiAgICBoaWdobGlnaHQ6IDEsXG4gICAgdXBkYXRlOiAyLFxuICAgIG1vdmU6IDIsXG4gICAgcmVsb2FkOiAyLFxuICAgIHJlbW92ZTogMSxcbiAgICBkZXRlY3RMYW5ndWFnZTogMSxcbiAgICBjYXB0dXJlVmlzaWJsZVRhYjogMixcbiAgICBleGVjdXRlU2NyaXB0OiAyLFxuICAgIGluc2VydENTUzogMixcbiAgICBzZXRab29tOiAyLFxuICAgIGdldFpvb206IDEsXG4gICAgc2V0Wm9vbVNldHRpbmdzOiAyLFxuICAgIGdldFpvb21TZXR0aW5nczogMVxuICB9LFxuICB0b3BTaXRlczoge1xuICAgIGdldDogMFxuICB9LFxuICB0dHM6IHtcbiAgICBzcGVhazogMixcbiAgICBpc1NwZWFraW5nOiAwLFxuICAgIGdldFZvaWNlczogMFxuICB9LFxuICB3ZWJOYXZpZ2F0aW9uOiB7XG4gICAgZ2V0RnJhbWU6IDEsXG4gICAgZ2V0QWxsRnJhbWVzOiAxXG4gIH0sXG4gIHdlYlJlcXVlc3Q6IHtcbiAgICBoYW5kbGVyQmVoYXZpb3JDaGFuZ2VkOiAwXG4gIH0sXG4gIHdlYnN0b3JlOiB7XG4gICAgaW5zdGFsbDogMVxuICB9LFxuICB3aW5kb3dzOiB7XG4gICAgZ2V0OiAyLFxuICAgIGdldEN1cnJlbnQ6IDEsXG4gICAgZ2V0TGFzdEZvY3VzZWQ6IDEsXG4gICAgZ2V0QWxsOiAxLFxuICAgIGNyZWF0ZTogMSxcbiAgICB1cGRhdGU6IDIsXG4gICAgcmVtb3ZlOiAxXG4gIH0sXG4gIGFsYXJtczoge1xuICAgIGdldDogMSxcbiAgICBnZXRBbGw6IDAsXG4gICAgY2xlYXI6IDEsXG4gICAgY2xlYXJBbGw6IDBcbiAgfSxcbiAgcGxhdGZvcm1LZXlzOiB7XG4gICAgc2VsZWN0Q2xpZW50Q2VydGlmaWNhdGVzOiAxLFxuICAgIGdldEtleVBhaXI6IDIsXG4gICAgdmVyaWZ5VExTU2VydmVyQ2VydGlmaWNhdGU6IDFcbiAgfVxufVxuIiwiY29uc3QgY3ljbGUgPSByZXF1aXJlKCcuL2xpYi9jeWNsZScpXG5jb25zdCB7Q2lyY3VsYXRvcn0gPSByZXF1aXJlKCcuL2xpYi9DaXJjdWxhdG9yJylcblxubW9kdWxlLmV4cG9ydHMgPSB7Y3ljbGUsIENpcmN1bGF0b3J9XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgY3ljbGUgPSByZXF1aXJlKCcuL2N5Y2xlJylcblxuY2xhc3MgQ2lyY3VsYXRvciB7XG4gIC8qKlxuICAgKiBXcmFwIGFuIGl0ZXJhYmxlIGFuZCBhbGxvdyBjeWNsaW5nIGl0cyBlbGVtZW50cyBpbmZpbml0ZWx5XG4gICAqIEBwYXJhbSAge0l0ZXJhYmxlfSBpdGVyYWJsZSBJdGVyYWJsZSB0byBjeWNsZVxuICAgKiBAcmV0dXJuIHtDaXJjdWxhdG9yfVxuICAgKi9cbiAgY29uc3RydWN0b3IoaXRlcmFibGUpIHtcbiAgICBjb25zdCBhcnIgPSBpdGVyYWJsZSA/IEFycmF5LmZyb20oaXRlcmFibGUpIDogW11cbiAgICB0aGlzLnNpemUgPSBhcnIubGVuZ3RoXG4gICAgdGhpcy5jeWNsZSA9IGN5Y2xlKGFycilcbiAgICAvLyBJbml0IG5ld2Jvcm4gZ2VuZXJhdG9yXG4gICAgdGhpcy5jeWNsZS5uZXh0KClcbiAgfVxuICAqW1N5bWJvbC5pdGVyYXRvcl0oKSB7XG4gICAgLy8gU2FtZSBhcyByZXR1cm4gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKVxuICAgIHlpZWxkKiBBcnJheS5mcm9tKEFycmF5KHRoaXMuc2l6ZSksIChfLCBpKSA9PiB0aGlzLnN0ZXAoKyEhaSkpXG4gICAgLy8gUmVzZXQgdG8gc3RhcnRcbiAgICB0aGlzLm5leHQoKVxuICB9XG4gIC8qKlxuICAgKiBTdGVwIHRocm91Z2ggdGhlIGN5Y2xlXG4gICAqIEBwYXJhbSAge251bWJlcn0gbiBOdW1iZXIgb2Ygc3RlcHNcbiAgICogQHJldHVybiB7fVxuICAgKi9cbiAgc3RlcChuKSB7XG4gICAgcmV0dXJuIHRoaXMuY3ljbGUubmV4dChuKS52YWx1ZVxuICB9XG4gIGN1cnJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcCgwKVxuICB9XG4gIHByZXYoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcCgtMSlcbiAgfVxuICBuZXh0KCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXAoMSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtDaXJjdWxhdG9yfVxuIiwiJ3VzZSBzdHJpY3QnXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zdGFudC1jb25kaXRpb24gKi9cblxuLyoqXG4gKiBHZW5lcmF0b3IgZm9yIGN5Y2xpbmcgYW4gYXJyYXkgaW4gYm90aCBkaXJlY3Rpb25zXG4gKiBAcGFyYW0gIHtBcnJheX0gYXJyXG4gKiBAcmV0dXJuIHtHZW5lcmF0b3J9XG4gKi9cbmZ1bmN0aW9uKiBjeWNsZShhcnIpIHtcbiAgbGV0IGkgPSAwXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgaSA9IChhcnIubGVuZ3RoICsgaSArICh5aWVsZCBhcnJbaV0pKSAlIGFyci5sZW5ndGhcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGN5Y2xlXG4iXX0=

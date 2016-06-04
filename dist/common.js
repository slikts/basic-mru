require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({42:[function(require,module,exports){
'use strict';

let init = (() => {
  var ref = _asyncToGenerator(function* (filterFn = function () {
    return true;
  }) {
    const bg = yield chrome.runtime.getBackgroundPage();
    const tabIds = bg.windows.get((yield chrome.windows.getCurrent()).id);
    const tabs = (yield Promise.all([...tabIds].map(function (id) {
      return chrome.tabs.get(id);
    }))).filter(filterFn);
    const dom = document.createRange().createContextualFragment(list(tabs));
    const cycle = new TabCycle(dom.querySelectorAll('.tab'));
    const tabMap = new Map(tabs.map(function (tab) {
      return [String(tab.id), tab];
    }));
    Array.from(dom.querySelectorAll('.placeholder')).forEach(function (el) {
      const { id, key } = el.dataset;
      el.textContent = tabMap.get(id)[key];
      if (key === 'title') el.title = el.textContent;
    });
    if (!tabs.length) dom.querySelector('#switcher').classList.add('empty');
    const current = dom.querySelector(`.tab-${ tabIds.current() }`);
    if (current) current.classList.add('active');
    return { dom, cycle };
  });

  return function init(_x) {
    return ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const { Circulator } = require('circulator');

const cn = 'selected';
class TabCycle extends Circulator {
  constructor(it) {
    super(it);
    this.current();
    const hash = location.hash.slice(1);
    if (this[hash]) {
      this[hash]();
      // location.hash = ''
      // history.pushState('', document.title, location.href.split('#')[0])
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
const item = ({ id, favIconUrl }) => `<li data-id="${ id }" class="tab tab-${ id }">
  <p class="title"><img class="favicon" src="${ favIconUrl || '' }" width="16" height="16">${ placeholder(id, 'title') }</p>
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcX3N3aXRjaGVyLmpzIiwic3JjXFx1dGlsLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2Vwcm94eS1jaHJvbWUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZXByb3h5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2Vwcm94eS9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZXByb3h5L3NyYy9jYWNoZWQuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZXByb3h5L3NyYy9wcm9taXNlcHJveHkuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZXByb3h5L3NyYy91dGlsLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2Vwcm94eS1jaHJvbWUvc2NoZW1hLmpzIiwibm9kZV9tb2R1bGVzL2NpcmN1bGF0b3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2lyY3VsYXRvci9saWIvQ2lyY3VsYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9jaXJjdWxhdG9yL2xpYi9jeWNsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs4QkNpQ0EsV0FBb0IsV0FBVztBQUFBLFdBQU0sSUFBTjtBQUFBLEdBQS9CLEVBQTJDO0FBQ3pDLFVBQU0sS0FBSyxNQUFNLE9BQU8sT0FBUCxDQUFlLGlCQUFmLEVBQWpCO0FBQ0EsVUFBTSxTQUFTLEdBQUcsT0FBSCxDQUFXLEdBQVgsQ0FBZSxDQUFDLE1BQU0sT0FBTyxPQUFQLENBQWUsVUFBZixFQUFQLEVBQW9DLEVBQW5ELENBQWY7QUFDQSxVQUFNLE9BQU8sQ0FBQyxNQUFNLFFBQVEsR0FBUixDQUFZLENBQUMsR0FBRyxNQUFKLEVBQVksR0FBWixDQUFnQjtBQUFBLGFBQU0sT0FBTyxJQUFQLENBQVksR0FBWixDQUFnQixFQUFo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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3Qge0NpcmN1bGF0b3J9ID0gcmVxdWlyZSgnY2lyY3VsYXRvcicpXG5cbmNvbnN0IGNuID0gJ3NlbGVjdGVkJ1xuY2xhc3MgVGFiQ3ljbGUgZXh0ZW5kcyBDaXJjdWxhdG9yIHtcbiAgY29uc3RydWN0b3IoaXQpIHtcbiAgICBzdXBlcihpdClcbiAgICB0aGlzLmN1cnJlbnQoKVxuICAgIGNvbnN0IGhhc2ggPSBsb2NhdGlvbi5oYXNoLnNsaWNlKDEpXG4gICAgaWYgKHRoaXNbaGFzaF0pIHtcbiAgICAgIHRoaXNbaGFzaF0oKVxuICAgICAgLy8gbG9jYXRpb24uaGFzaCA9ICcnXG4gICAgICAvLyBoaXN0b3J5LnB1c2hTdGF0ZSgnJywgZG9jdW1lbnQudGl0bGUsIGxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSlcbiAgICB9XG4gIH1cbiAgbmV4dCgpIHtcbiAgICB0aGlzLmN1cnJlbnQoKS5jbGFzc0xpc3QucmVtb3ZlKGNuKVxuICAgIHN1cGVyLm5leHQoKS5jbGFzc0xpc3QuYWRkKGNuKVxuICB9XG4gIHByZXYoKSB7XG4gICAgdGhpcy5jdXJyZW50KCkuY2xhc3NMaXN0LnJlbW92ZShjbilcbiAgICBzdXBlci5wcmV2KCkuY2xhc3NMaXN0LmFkZChjbilcbiAgfVxufVxuXG5jaHJvbWUgPSByZXF1aXJlKCdwcm9taXNlcHJveHktY2hyb21lJykoY2hyb21lKVxuXG5jb25zdCBwbGFjZWhvbGRlciA9IChpZCwga2V5KSA9PiBgPHNwYW4gY2xhc3M9XCJwbGFjZWhvbGRlclwiIGRhdGEtaWQ9XCIke2lkfVwiIGRhdGEta2V5PVwiJHtrZXl9XCI+PC9zcGFuPmBcbmNvbnN0IGl0ZW0gPSAoe2lkLCBmYXZJY29uVXJsfSkgPT4gYDxsaSBkYXRhLWlkPVwiJHtpZH1cIiBjbGFzcz1cInRhYiB0YWItJHtpZH1cIj5cbiAgPHAgY2xhc3M9XCJ0aXRsZVwiPjxpbWcgY2xhc3M9XCJmYXZpY29uXCIgc3JjPVwiJHtmYXZJY29uVXJsIHx8ICcnfVwiIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiPiR7cGxhY2Vob2xkZXIoaWQsICd0aXRsZScpfTwvcD5cbiAgPHAgY2xhc3M9XCJ1cmxcIj4ke3BsYWNlaG9sZGVyKGlkLCAndXJsJyl9PC9wPlxuPC9saT5gXG5jb25zdCBsaXN0ID0gdGFicyA9PiBgPG9sIGlkPVwic3dpdGNoZXJcIj4ke3RhYnMubWFwKGl0ZW0pLmpvaW4oJycpfTwvb2w+YFxuXG5hc3luYyBmdW5jdGlvbiBpbml0KGZpbHRlckZuID0gKCkgPT4gdHJ1ZSkge1xuICBjb25zdCBiZyA9IGF3YWl0IGNocm9tZS5ydW50aW1lLmdldEJhY2tncm91bmRQYWdlKClcbiAgY29uc3QgdGFiSWRzID0gYmcud2luZG93cy5nZXQoKGF3YWl0IGNocm9tZS53aW5kb3dzLmdldEN1cnJlbnQoKSkuaWQpXG4gIGNvbnN0IHRhYnMgPSAoYXdhaXQgUHJvbWlzZS5hbGwoWy4uLnRhYklkc10ubWFwKGlkID0+IGNocm9tZS50YWJzLmdldChpZCkpKSkuZmlsdGVyKGZpbHRlckZuKVxuICBjb25zdCBkb20gPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpLmNyZWF0ZUNvbnRleHR1YWxGcmFnbWVudChsaXN0KHRhYnMpKVxuICBjb25zdCBjeWNsZSA9IG5ldyBUYWJDeWNsZShkb20ucXVlcnlTZWxlY3RvckFsbCgnLnRhYicpKVxuICBjb25zdCB0YWJNYXAgPSBuZXcgTWFwKHRhYnMubWFwKHRhYiA9PiBbU3RyaW5nKHRhYi5pZCksIHRhYl0pKVxuICBBcnJheS5mcm9tKGRvbS5xdWVyeVNlbGVjdG9yQWxsKCcucGxhY2Vob2xkZXInKSkuZm9yRWFjaChlbCA9PiB7XG4gICAgY29uc3Qge2lkLCBrZXl9ID0gZWwuZGF0YXNldFxuICAgIGVsLnRleHRDb250ZW50ID0gdGFiTWFwLmdldChpZClba2V5XVxuICAgIGlmIChrZXkgPT09ICd0aXRsZScpIGVsLnRpdGxlID0gZWwudGV4dENvbnRlbnRcbiAgfSlcbiAgaWYgKCF0YWJzLmxlbmd0aCkgZG9tLnF1ZXJ5U2VsZWN0b3IoJyNzd2l0Y2hlcicpLmNsYXNzTGlzdC5hZGQoJ2VtcHR5JylcbiAgY29uc3QgY3VycmVudCA9IGRvbS5xdWVyeVNlbGVjdG9yKGAudGFiLSR7dGFiSWRzLmN1cnJlbnQoKX1gKVxuICBpZiAoY3VycmVudCkgY3VycmVudC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKVxuICByZXR1cm4ge2RvbSwgY3ljbGV9XG59XG5cbmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZSA9PiB7XG4gIGlmIChlLmtleUNvZGUgPT09IDE4KSAge1xuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKCdzd2l0Y2hlcl9tb2RzX3VwJylcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBpbml0XG4iLCJjb25zdCBkZWJ1ZyA9IHRydWVcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGxvZzogZGVidWcgPyAoLi4uYXJncykgPT4geyBjb25zb2xlLmxvZygnbXJ1JywgLi4uYXJncyk7IHJldHVybiBhcmdzWzBdIH0gOiAoKSA9PiB7fSxcbn1cbiIsImNvbnN0IHtQcm9taXNlUHJveHl9ID0gcmVxdWlyZSgncHJvbWlzZXByb3h5JylcblxuY29uc3Qgc2NoZW1hID0gcmVxdWlyZSgnLi9zY2hlbWEnKVxuXG5jb25zdCBDaHJvbWVQcm9taXNlUHJveHkgPSB0YXJnZXQgPT4gUHJvbWlzZVByb3h5KHRhcmdldCwgc2NoZW1hKVxuXG5tb2R1bGUuZXhwb3J0cyA9IENocm9tZVByb21pc2VQcm94eVxuIiwiY29uc3Qge0NhY2hlZFByb21pc2VQcm94eX0gPSByZXF1aXJlKCcuL3NyYycpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBQcm9taXNlUHJveHk6IENhY2hlZFByb21pc2VQcm94eSxcbn1cbiIsImNvbnN0IHtQcm9taXNlUHJveHl9ID0gcmVxdWlyZSgnLi9wcm9taXNlcHJveHknKVxuY29uc3Qge0NhY2hlZFByb21pc2VQcm94eX0gPSByZXF1aXJlKCcuL2NhY2hlZCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1Byb21pc2VQcm94eSwgQ2FjaGVkUHJvbWlzZVByb3h5fVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHtQcm9taXNlUHJveHl9ID0gcmVxdWlyZSgnLi9wcm9taXNlcHJveHknKVxuXG4vKiogV3JhcHMgUHJvbWlzZVByb3h5IGZhY3RvcnkgYW5kIGNhY2hlcyBpbnN0YW5jZXMgaW4gYSBXZWFrTWFwICovXG5mdW5jdGlvbiBDYWNoZWRQcm9taXNlUHJveHkodGFyZ2V0LCBjb250ZXh0LCBjYWNoZSA9IG5ldyBXZWFrTWFwKCksIGZhY3RvcnkgPSBQcm9taXNlUHJveHkpIHtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGUuZ2V0KHRhcmdldClcbiAgaWYgKGNhY2hlZCkge1xuICAgIHJldHVybiBjYWNoZWRcbiAgfVxuICBjb25zdCBvYmogPSBmYWN0b3J5KHRhcmdldCwgY29udGV4dCxcbiAgICAodGFyZ2V0LCBjb250ZXh0KSA9PiBDYWNoZWRQcm9taXNlUHJveHkodGFyZ2V0LCBjb250ZXh0LCBjYWNoZSkpXG4gIGNhY2hlLnNldCh0YXJnZXQsIG9iailcbiAgcmV0dXJuIG9ialxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtDYWNoZWRQcm9taXNlUHJveHl9XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3Qge2luc2VydH0gPSByZXF1aXJlKCcuL3V0aWwnKVxuXG4vKipcbiAqIEZhY3Rvcnkgb2YgW2BQcm94eWBdWzFdIG9iamVjdHMgZm9yIHJlY3Vyc2l2ZWx5IHByb21pc2lmeWluZyBhIGNhbGxiYWNrLWJhc2VkIEFQSVxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldCBUaGUgQVBJIHRvIGJlIHByb21pc2lmZWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBzY2hlbWEgQVBJIHN0cnVjdHVyZSB3aXRoIGNhbGxiYWNrIHBhcmFtZXRlciBwb3NpdGlvblxuICogQHJldHVybiB7UHJveHl9XG4gKiBAYWxpYXMgbW9kdWxlOnByb21pc2Vwcm94eVxuICogQGV4YW1wbGVcbiAqIC8vIERlZmluZSBjaHJvbWUudGFicy5xdWVyeShfLCBjYWxsYmFjaykgYW5kIC51cGRhdGUoXywgXywgY2FsbGJhY2spIG1ldGhvZHNcbiAqIC8vIDEgYW5kIDIgYXJlIHRoZSBwb3NpdGlvbnMgb2YgdGhlIGNhbGxiYWNrIHBhcmFtZXRlcnMgKHplcm8tYmFzZWQpXG4gKiBjb25zdCBzY2hlbWEgPSB7dGFiczoge3F1ZXJ5OiAxLCB1cGRhdGU6IDJ9fVxuICogLy8gUHJvbWlzaWZ5IHRoZSBDaHJvbWUgQVBJIGJhc2VkIG9uIHRoZSBzY2hlbWFcbiAqIGNvbnN0IF9jaHJvbWUgPSBQcm9taXNlUHJveHkoY2hyb21lLCBzY2hlbWEpXG4gKiAvLyBUaGUgcHJvbWlzaWZpZWQgbWV0aG9kcyByZXR1cm4gYSBQcm9taXNlIGlmIHRoZSBjYWxsYmFjayBwYXJhbWV0ZXIgaXMgb21pdHRlZFxuICogX2Nocm9tZS50YWJzLnF1ZXJ5KGluZm8pLnRoZW4oY2FsbGJhY2spXG4gKiAvLyBUaGUgc2FtZSBtZXRob2RzIGNhbiBzdGlsbCBiZSB1c2VkIHdpdGggYSBjYWxsYmFja1xuICogX2Nocm9tZS50YWJzLnF1ZXJ5KGluZm8sIGNhbGxiYWNrKVxuICovXG5mdW5jdGlvbiBQcm9taXNlUHJveHkodGFyZ2V0LCBzY2hlbWEsIHNlbGYgPSBQcm9taXNlUHJveHkpIHtcbiAgY29uc3QgaGFuZGxlciA9IHtcbiAgICBhcHBseShtZXRob2QsIHJlY2VpdmVyLCBhcmdzKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHNjaGVtYVxuICAgICAgaWYgKGFyZ3NbaW5kZXhdICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIFJlZmxlY3QuYXBwbHkobWV0aG9kLCByZWNlaXZlciwgYXJncylcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IFJlZmxlY3QuYXBwbHkobWV0aG9kLCByZWNlaXZlciwgaW5zZXJ0KGFyZ3MsIHJlc29sdmUsIGluZGV4KSkpXG4gICAgfSxcbiAgICBnZXQodGFyZ2V0LCBrZXkpIHtcbiAgICAgIGNvbnN0IHByb3AgPSB0YXJnZXRba2V5XVxuICAgICAgaWYgKHNjaGVtYS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHJldHVybiBzZWxmKHByb3AsIHNjaGVtYVtrZXldKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHByb3BcbiAgICB9LFxuICB9XG4gIHJldHVybiBuZXcgUHJveHkodGFyZ2V0LCBoYW5kbGVyKVxufVxuXG4vKipcbiAqIEBtb2R1bGUgcHJvbWlzZXByb3h5XG4gKiBAZXhhbXBsZVxuICogY29uc3Qge1Byb21pc2VQcm94eX0gPSByZXF1aXJlKFwicHJvbWlzZXByb3h5XCIpXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1Byb21pc2VQcm94eX1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5zZXJ0OiAoYXJyLCBpdGVtLCBwb3MpID0+IGFyci5zbGljZSgwLCBwb3MpLmNvbmNhdChbaXRlbV0sIGFyci5zbGljZShwb3MpKVxufVxuIiwiLyogR2VuZXJhdGVkIGZyb20gYXBpLmpzb24gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICBib29rbWFya3M6IHtcbiAgICBnZXQ6IDEsXG4gICAgZ2V0Q2hpbGRyZW46IDEsXG4gICAgZ2V0UmVjZW50OiAxLFxuICAgIGdldFRyZWU6IDAsXG4gICAgZ2V0U3ViVHJlZTogMSxcbiAgICBzZWFyY2g6IDEsXG4gICAgY3JlYXRlOiAxLFxuICAgIG1vdmU6IDIsXG4gICAgdXBkYXRlOiAyLFxuICAgIHJlbW92ZTogMSxcbiAgICByZW1vdmVUcmVlOiAxXG4gIH0sXG4gIGJyb3dzZXJBY3Rpb246IHtcbiAgICBnZXRUaXRsZTogMSxcbiAgICBzZXRJY29uOiAxLFxuICAgIGdldFBvcHVwOiAxLFxuICAgIGdldEJhZGdlVGV4dDogMSxcbiAgICBnZXRCYWRnZUJhY2tncm91bmRDb2xvcjogMVxuICB9LFxuICBicm93c2luZ0RhdGE6IHtcbiAgICBzZXR0aW5nczogMCxcbiAgICByZW1vdmU6IDIsXG4gICAgcmVtb3ZlQXBwY2FjaGU6IDEsXG4gICAgcmVtb3ZlQ2FjaGU6IDEsXG4gICAgcmVtb3ZlQ29va2llczogMSxcbiAgICByZW1vdmVEb3dubG9hZHM6IDEsXG4gICAgcmVtb3ZlRmlsZVN5c3RlbXM6IDEsXG4gICAgcmVtb3ZlRm9ybURhdGE6IDEsXG4gICAgcmVtb3ZlSGlzdG9yeTogMSxcbiAgICByZW1vdmVJbmRleGVkREI6IDEsXG4gICAgcmVtb3ZlTG9jYWxTdG9yYWdlOiAxLFxuICAgIHJlbW92ZVBsdWdpbkRhdGE6IDEsXG4gICAgcmVtb3ZlUGFzc3dvcmRzOiAxLFxuICAgIHJlbW92ZVdlYlNRTDogMVxuICB9LFxuICBjb21tYW5kczoge1xuICAgIGdldEFsbDogMFxuICB9LFxuICBjb250ZXh0TWVudXM6IHtcbiAgICBjcmVhdGU6IDEsXG4gICAgdXBkYXRlOiAyLFxuICAgIHJlbW92ZTogMSxcbiAgICByZW1vdmVBbGw6IDBcbiAgfSxcbiAgY29va2llczoge1xuICAgIGdldDogMSxcbiAgICBnZXRBbGw6IDEsXG4gICAgc2V0OiAxLFxuICAgIHJlbW92ZTogMSxcbiAgICBnZXRBbGxDb29raWVTdG9yZXM6IDBcbiAgfSxcbiAgZGVidWdnZXI6IHtcbiAgICBhdHRhY2g6IDIsXG4gICAgZGV0YWNoOiAxLFxuICAgIHNlbmRDb21tYW5kOiAzLFxuICAgIGdldFRhcmdldHM6IDBcbiAgfSxcbiAgZGVza3RvcENhcHR1cmU6IHtcbiAgICBjaG9vc2VEZXNrdG9wTWVkaWE6IDJcbiAgfSxcbiAgZGV2dG9vbHM6IHtcbiAgICBpbnNwZWN0ZWRXaW5kb3c6IHtcbiAgICAgIGV2YWw6IDIsXG4gICAgICBnZXRSZXNvdXJjZXM6IDBcbiAgICB9LFxuICAgIG5ldHdvcms6IHtcbiAgICAgIGdldEhBUjogMFxuICAgIH0sXG4gICAgcGFuZWxzOiB7XG4gICAgICBjcmVhdGU6IDMsXG4gICAgICBzZXRPcGVuUmVzb3VyY2VIYW5kbGVyOiAwLFxuICAgICAgb3BlblJlc291cmNlOiAyXG4gICAgfVxuICB9LFxuICBkb2N1bWVudFNjYW46IHtcbiAgICBzY2FuOiAxXG4gIH0sXG4gIGRvd25sb2Fkczoge1xuICAgIGRvd25sb2FkOiAxLFxuICAgIHNlYXJjaDogMSxcbiAgICBwYXVzZTogMSxcbiAgICByZXN1bWU6IDEsXG4gICAgY2FuY2VsOiAxLFxuICAgIGdldEZpbGVJY29uOiAyLFxuICAgIGVyYXNlOiAxLFxuICAgIHJlbW92ZUZpbGU6IDEsXG4gICAgYWNjZXB0RGFuZ2VyOiAxXG4gIH0sXG4gIGV4dGVuc2lvbjoge1xuICAgIHNlbmRSZXF1ZXN0OiAyLFxuICAgIGlzQWxsb3dlZEluY29nbml0b0FjY2VzczogMCxcbiAgICBpc0FsbG93ZWRGaWxlU2NoZW1lQWNjZXNzOiAwXG4gIH0sXG4gIGZvbnRTZXR0aW5nczoge1xuICAgIGNsZWFyRm9udDogMSxcbiAgICBnZXRGb250OiAxLFxuICAgIHNldEZvbnQ6IDEsXG4gICAgZ2V0Rm9udExpc3Q6IDAsXG4gICAgY2xlYXJEZWZhdWx0Rm9udFNpemU6IDEsXG4gICAgZ2V0RGVmYXVsdEZvbnRTaXplOiAxLFxuICAgIHNldERlZmF1bHRGb250U2l6ZTogMSxcbiAgICBjbGVhckRlZmF1bHRGaXhlZEZvbnRTaXplOiAxLFxuICAgIGdldERlZmF1bHRGaXhlZEZvbnRTaXplOiAxLFxuICAgIHNldERlZmF1bHRGaXhlZEZvbnRTaXplOiAxLFxuICAgIGNsZWFyTWluaW11bUZvbnRTaXplOiAxLFxuICAgIGdldE1pbmltdW1Gb250U2l6ZTogMSxcbiAgICBzZXRNaW5pbXVtRm9udFNpemU6IDFcbiAgfSxcbiAgZ2NtOiB7XG4gICAgcmVnaXN0ZXI6IDEsXG4gICAgdW5yZWdpc3RlcjogMCxcbiAgICBzZW5kOiAxXG4gIH0sXG4gIGhpc3Rvcnk6IHtcbiAgICBzZWFyY2g6IDEsXG4gICAgZ2V0VmlzaXRzOiAxLFxuICAgIGFkZFVybDogMSxcbiAgICBkZWxldGVVcmw6IDEsXG4gICAgZGVsZXRlUmFuZ2U6IDEsXG4gICAgZGVsZXRlQWxsOiAwXG4gIH0sXG4gIGkxOG46IHtcbiAgICBnZXRBY2NlcHRMYW5ndWFnZXM6IDAsXG4gICAgZGV0ZWN0TGFuZ3VhZ2U6IDFcbiAgfSxcbiAgaWRlbnRpdHk6IHtcbiAgICBnZXRBY2NvdW50czogMCxcbiAgICBnZXRBdXRoVG9rZW46IDEsXG4gICAgZ2V0UHJvZmlsZVVzZXJJbmZvOiAwLFxuICAgIHJlbW92ZUNhY2hlZEF1dGhUb2tlbjogMSxcbiAgICBsYXVuY2hXZWJBdXRoRmxvdzogMVxuICB9LFxuICBpZGxlOiB7XG4gICAgcXVlcnlTdGF0ZTogMVxuICB9LFxuICBpbnB1dDoge1xuICAgIGltZToge1xuICAgICAgc2V0Q29tcG9zaXRpb246IDEsXG4gICAgICBjbGVhckNvbXBvc2l0aW9uOiAxLFxuICAgICAgY29tbWl0VGV4dDogMSxcbiAgICAgIHNlbmRLZXlFdmVudHM6IDEsXG4gICAgICBzZXRDYW5kaWRhdGVXaW5kb3dQcm9wZXJ0aWVzOiAxLFxuICAgICAgc2V0Q2FuZGlkYXRlczogMSxcbiAgICAgIHNldEN1cnNvclBvc2l0aW9uOiAxLFxuICAgICAgc2V0TWVudUl0ZW1zOiAxLFxuICAgICAgdXBkYXRlTWVudUl0ZW1zOiAxLFxuICAgICAgZGVsZXRlU3Vycm91bmRpbmdUZXh0OiAxXG4gICAgfVxuICB9LFxuICBtYW5hZ2VtZW50OiB7XG4gICAgZ2V0QWxsOiAwLFxuICAgIGdldDogMSxcbiAgICBnZXRTZWxmOiAwLFxuICAgIGdldFBlcm1pc3Npb25XYXJuaW5nc0J5SWQ6IDEsXG4gICAgZ2V0UGVybWlzc2lvbldhcm5pbmdzQnlNYW5pZmVzdDogMSxcbiAgICBzZXRFbmFibGVkOiAyLFxuICAgIHVuaW5zdGFsbDogMixcbiAgICB1bmluc3RhbGxTZWxmOiAxLFxuICAgIGxhdW5jaEFwcDogMSxcbiAgICBjcmVhdGVBcHBTaG9ydGN1dDogMSxcbiAgICBzZXRMYXVuY2hUeXBlOiAyLFxuICAgIGdlbmVyYXRlQXBwRm9yTGluazogMlxuICB9LFxuICBub3RpZmljYXRpb25zOiB7XG4gICAgY3JlYXRlOiAyLFxuICAgIHVwZGF0ZTogMixcbiAgICBjbGVhcjogMSxcbiAgICBnZXRBbGw6IDAsXG4gICAgZ2V0UGVybWlzc2lvbkxldmVsOiAwXG4gIH0sXG4gIHBhZ2VBY3Rpb246IHtcbiAgICBnZXRUaXRsZTogMSxcbiAgICBzZXRJY29uOiAxLFxuICAgIGdldFBvcHVwOiAxXG4gIH0sXG4gIHBhZ2VDYXB0dXJlOiB7XG4gICAgc2F2ZUFzTUhUTUw6IDFcbiAgfSxcbiAgcGVybWlzc2lvbnM6IHtcbiAgICBnZXRBbGw6IDAsXG4gICAgY29udGFpbnM6IDEsXG4gICAgcmVxdWVzdDogMSxcbiAgICByZW1vdmU6IDFcbiAgfSxcbiAgcnVudGltZToge1xuICAgIGdldEJhY2tncm91bmRQYWdlOiAwLFxuICAgIG9wZW5PcHRpb25zUGFnZTogMCxcbiAgICBzZXRVbmluc3RhbGxVUkw6IDEsXG4gICAgcmVxdWVzdFVwZGF0ZUNoZWNrOiAwLFxuICAgIHNlbmRNZXNzYWdlOiAzLFxuICAgIHNlbmROYXRpdmVNZXNzYWdlOiAyLFxuICAgIGdldFBsYXRmb3JtSW5mbzogMCxcbiAgICBnZXRQYWNrYWdlRGlyZWN0b3J5RW50cnk6IDBcbiAgfSxcbiAgc2Vzc2lvbnM6IHtcbiAgICBnZXRSZWNlbnRseUNsb3NlZDogMSxcbiAgICBnZXREZXZpY2VzOiAxLFxuICAgIHJlc3RvcmU6IDFcbiAgfSxcbiAgc3lzdGVtOiB7XG4gICAgY3B1OiB7XG4gICAgICBnZXRJbmZvOiAwXG4gICAgfSxcbiAgICBtZW1vcnk6IHtcbiAgICAgIGdldEluZm86IDBcbiAgICB9LFxuICAgIHN0b3JhZ2U6IHtcbiAgICAgIGdldEluZm86IDAsXG4gICAgICBlamVjdERldmljZTogMSxcbiAgICAgIGdldEF2YWlsYWJsZUNhcGFjaXR5OiAxXG4gICAgfVxuICB9LFxuICB0YWJDYXB0dXJlOiB7XG4gICAgY2FwdHVyZTogMSxcbiAgICBnZXRDYXB0dXJlZFRhYnM6IDBcbiAgfSxcbiAgdGFiczoge1xuICAgIGdldDogMSxcbiAgICBnZXRDdXJyZW50OiAwLFxuICAgIHNlbmRSZXF1ZXN0OiAyLFxuICAgIHNlbmRNZXNzYWdlOiAzLFxuICAgIGdldFNlbGVjdGVkOiAxLFxuICAgIGdldEFsbEluV2luZG93OiAxLFxuICAgIGNyZWF0ZTogMSxcbiAgICBkdXBsaWNhdGU6IDEsXG4gICAgcXVlcnk6IDEsXG4gICAgaGlnaGxpZ2h0OiAxLFxuICAgIHVwZGF0ZTogMixcbiAgICBtb3ZlOiAyLFxuICAgIHJlbG9hZDogMixcbiAgICByZW1vdmU6IDEsXG4gICAgZGV0ZWN0TGFuZ3VhZ2U6IDEsXG4gICAgY2FwdHVyZVZpc2libGVUYWI6IDIsXG4gICAgZXhlY3V0ZVNjcmlwdDogMixcbiAgICBpbnNlcnRDU1M6IDIsXG4gICAgc2V0Wm9vbTogMixcbiAgICBnZXRab29tOiAxLFxuICAgIHNldFpvb21TZXR0aW5nczogMixcbiAgICBnZXRab29tU2V0dGluZ3M6IDFcbiAgfSxcbiAgdG9wU2l0ZXM6IHtcbiAgICBnZXQ6IDBcbiAgfSxcbiAgdHRzOiB7XG4gICAgc3BlYWs6IDIsXG4gICAgaXNTcGVha2luZzogMCxcbiAgICBnZXRWb2ljZXM6IDBcbiAgfSxcbiAgd2ViTmF2aWdhdGlvbjoge1xuICAgIGdldEZyYW1lOiAxLFxuICAgIGdldEFsbEZyYW1lczogMVxuICB9LFxuICB3ZWJSZXF1ZXN0OiB7XG4gICAgaGFuZGxlckJlaGF2aW9yQ2hhbmdlZDogMFxuICB9LFxuICB3ZWJzdG9yZToge1xuICAgIGluc3RhbGw6IDFcbiAgfSxcbiAgd2luZG93czoge1xuICAgIGdldDogMixcbiAgICBnZXRDdXJyZW50OiAxLFxuICAgIGdldExhc3RGb2N1c2VkOiAxLFxuICAgIGdldEFsbDogMSxcbiAgICBjcmVhdGU6IDEsXG4gICAgdXBkYXRlOiAyLFxuICAgIHJlbW92ZTogMVxuICB9LFxuICBhbGFybXM6IHtcbiAgICBnZXQ6IDEsXG4gICAgZ2V0QWxsOiAwLFxuICAgIGNsZWFyOiAxLFxuICAgIGNsZWFyQWxsOiAwXG4gIH0sXG4gIHBsYXRmb3JtS2V5czoge1xuICAgIHNlbGVjdENsaWVudENlcnRpZmljYXRlczogMSxcbiAgICBnZXRLZXlQYWlyOiAyLFxuICAgIHZlcmlmeVRMU1NlcnZlckNlcnRpZmljYXRlOiAxXG4gIH1cbn1cbiIsImNvbnN0IGN5Y2xlID0gcmVxdWlyZSgnLi9saWIvY3ljbGUnKVxuY29uc3Qge0NpcmN1bGF0b3J9ID0gcmVxdWlyZSgnLi9saWIvQ2lyY3VsYXRvcicpXG5cbm1vZHVsZS5leHBvcnRzID0ge2N5Y2xlLCBDaXJjdWxhdG9yfVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGN5Y2xlID0gcmVxdWlyZSgnLi9jeWNsZScpXG5cbmNsYXNzIENpcmN1bGF0b3Ige1xuICAvKipcbiAgICogV3JhcCBhbiBpdGVyYWJsZSBhbmQgYWxsb3cgY3ljbGluZyBpdHMgZWxlbWVudHMgaW5maW5pdGVseVxuICAgKiBAcGFyYW0gIHtJdGVyYWJsZX0gaXRlcmFibGUgSXRlcmFibGUgdG8gY3ljbGVcbiAgICogQHJldHVybiB7Q2lyY3VsYXRvcn1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGl0ZXJhYmxlKSB7XG4gICAgY29uc3QgYXJyID0gaXRlcmFibGUgPyBBcnJheS5mcm9tKGl0ZXJhYmxlKSA6IFtdXG4gICAgdGhpcy5zaXplID0gYXJyLmxlbmd0aFxuICAgIHRoaXMuY3ljbGUgPSBjeWNsZShhcnIpXG4gICAgLy8gSW5pdCBuZXdib3JuIGdlbmVyYXRvclxuICAgIHRoaXMuY3ljbGUubmV4dCgpXG4gIH1cbiAgKltTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIC8vIFNhbWUgYXMgcmV0dXJuIGFycltTeW1ib2wuaXRlcmF0b3JdKClcbiAgICB5aWVsZCogQXJyYXkuZnJvbShBcnJheSh0aGlzLnNpemUpLCAoXywgaSkgPT4gdGhpcy5zdGVwKCshIWkpKVxuICAgIC8vIFJlc2V0IHRvIHN0YXJ0XG4gICAgdGhpcy5uZXh0KClcbiAgfVxuICAvKipcbiAgICogU3RlcCB0aHJvdWdoIHRoZSBjeWNsZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG4gTnVtYmVyIG9mIHN0ZXBzXG4gICAqIEByZXR1cm4ge31cbiAgICovXG4gIHN0ZXAobikge1xuICAgIHJldHVybiB0aGlzLmN5Y2xlLm5leHQobikudmFsdWVcbiAgfVxuICBjdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXAoMClcbiAgfVxuICBwcmV2KCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXAoLTEpXG4gIH1cbiAgbmV4dCgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGVwKDEpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7Q2lyY3VsYXRvcn1cbiIsIid1c2Ugc3RyaWN0J1xuLyogZXNsaW50LWRpc2FibGUgbm8tY29uc3RhbnQtY29uZGl0aW9uICovXG5cbi8qKlxuICogR2VuZXJhdG9yIGZvciBjeWNsaW5nIGFuIGFycmF5IGluIGJvdGggZGlyZWN0aW9uc1xuICogQHBhcmFtICB7QXJyYXl9IGFyclxuICogQHJldHVybiB7R2VuZXJhdG9yfVxuICovXG5mdW5jdGlvbiogY3ljbGUoYXJyKSB7XG4gIGxldCBpID0gMFxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGkgPSAoYXJyLmxlbmd0aCArIGkgKyAoeWllbGQgYXJyW2ldKSkgJSBhcnIubGVuZ3RoXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjeWNsZVxuIl19

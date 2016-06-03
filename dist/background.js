require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({43:[function(require,module,exports){
'use strict';

let init = (() => {
  var ref = _asyncToGenerator(function* () {
    window.windows = new WindowMap(chrome.tabs);
    const commands = yield chrome.commands.getAll();
    windows.populate((yield chrome.tabs.query({})));

    log('init', { commands, windows });

    chrome.runtime.onMessage.addListener(function (key, sender) {
      actions.remove();
      log('message', key, sender);
    });

    chrome.commands.onCommand.addListener((() => {
      var ref = _asyncToGenerator(function* (command) {
        if (actions.tab) {
          // Forward command
          chrome.tabs.sendMessage(actions.tab.id, command);
          return;
        }
        const [{ index }] = yield chrome.tabs.query({
          currentWindow: true,
          active: true
        });
        actions.tab = yield chrome.tabs.create({
          url: chrome.extension.getURL(`switcher.html#${ command }`),
          active: true,
          index: index + 1
        });
        log('command', command);
      });

      return function (_x) {
        return ref.apply(this, arguments);
      };
    })());
  });

  return function init() {
    return ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

Object.entries = require('object.entries');

const { log } = require('./util');
const { WindowMap } = require('./Tabs/WindowMap');

chrome = require('promiseproxy-chrome')(chrome);

const actions = {
  remove() {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (!_this.tab) return;
      const newActiveId = yield chrome.tabs.sendMessage(_this.tab.id, 'close');
      chrome.tabs.update(newActiveId, { active: true });
      chrome.tabs.remove(_this.tab.id);
      _this.tab = null;
    })();
  }
};


chrome.runtime.onStartup.addListener(init);
chrome.runtime.onInstalled.addListener(init);

/*
const modKeys = ['shift', 'alt', 'ctrl', 'meta']

function parseShortcut(text) {
  return text.split('+')
      .map(x => x.toLowerCase())
      .filter(x => modKeys.includes(x))
}
*/

},{"./Tabs/WindowMap":40,"./util":47,"object.entries":29,"promiseproxy-chrome":32}],40:[function(require,module,exports){
'use strict';

const { CollectionMap } = require('CollectionMap');

const handlers = require('./handlers');
const { Window } = require('./Window');

class WindowMap extends CollectionMap {
  constructor(chromeTabs) {
    super(Window, 'size');
    Object.entries(this.handlers).forEach(([name, handler]) => {
      chromeTabs[name].addListener(handler.bind(this));
    });
  }
  update(method, tabId, windowId) {
    return this.set(windowId, this.get(windowId)[method](tabId));
  }
  append(tabId, windowId) {
    return this.update('append', tabId, windowId);
  }
  prepend(tabId, windowId) {
    return this.update('prepend', tabId, windowId);
  }
  remove(tabId, windowId) {
    return this.update('remove', tabId, windowId);
  }
  populate(tabs) {
    tabs.forEach(({ id, windowId }) => this.append(id, windowId));
    return this;
  }
}

Object.assign(WindowMap.prototype, { handlers });

module.exports = { WindowMap };

},{"./Window":39,"./handlers":41,"CollectionMap":1}],41:[function(require,module,exports){
'use strict';

const util = require('../util');
const log = (...args) => util.log('tab', ...args);

const handlers = {
  onCreated({ id, windowId }) {
    this.append(id, windowId);
  },
  onRemoved(tabId, { windowId }) {
    this.remove(tabId, windowId);
  },
  onDetached(tabId, { oldWindowId }) {
    this.remove(tabId, oldWindowId);
  },
  onAttached(tabId, { newWindowId }) {
    this.append(tabId, newWindowId);
  },
  onActivated({ tabId, windowId }) {
    this.remove(tabId, windowId);
    this.prepend(tabId, windowId);
  },
  onReplaced(tabId, { addedTabId, removedTabId }) {
    log('replaced', { tabId, addedTabId, removedTabId });
  }
};

const debug = true;
if (debug) {
  Object.entries(handlers).forEach(([k, fn]) => {
    handlers[k] = function (...args) {
      log(k, ...args);
      fn.apply(this, args);
    };
  });
}

module.exports = handlers;

},{"../util":47}],39:[function(require,module,exports){
'use strict';

const { Circulator } = require('circulator');

class Window extends Circulator {
  prepend(tabId) {
    return new this.constructor([tabId].concat([...this]));
  }
  append(tabId) {
    return new this.constructor([...this].concat(tabId));
  }
  remove(tabId) {
    return new this.constructor([...this].filter(x => x !== tabId));
  }
}

module.exports = { Window };

},{"circulator":2}],29:[function(require,module,exports){
'use strict';

var define = require('define-properties');

var implementation = require('./implementation');
var getPolyfill = require('./polyfill');
var shim = require('./shim');

define(implementation, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

module.exports = implementation;

},{"./implementation":28,"./polyfill":30,"./shim":31,"define-properties":5}],31:[function(require,module,exports){
'use strict';

var getPolyfill = require('./polyfill');
var define = require('define-properties');

module.exports = function shimEntries() {
	var polyfill = getPolyfill();
	define(Object, { entries: polyfill }, { entries: function () { return Object.entries !== polyfill; } });
	return polyfill;
};

},{"./polyfill":30,"define-properties":5}],30:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	return typeof Object.entries === 'function' ? Object.entries : implementation;
};

},{"./implementation":28}],28:[function(require,module,exports){
'use strict';

var ES = require('es-abstract/es7');
var has = require('has');
var bind = require('function-bind');
var isEnumerable = bind.call(Function.call, Object.prototype.propertyIsEnumerable);

module.exports = function entries(O) {
	var obj = ES.RequireObjectCoercible(O);
	var entrys = [];
	for (var key in obj) {
		if (has(obj, key) && isEnumerable(obj, key)) {
			entrys.push([key, obj[key]]);
		}
	}
	return entrys;
};

},{"es-abstract/es7":8,"function-bind":20,"has":21}],21:[function(require,module,exports){
var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":20}],8:[function(require,module,exports){
'use strict';

var ES6 = require('./es6');
var assign = require('./helpers/assign');

var ES7 = assign(ES6, {
	// https://github.com/tc39/ecma262/pull/60
	SameValueNonNumber: function SameValueNonNumber(x, y) {
		if (typeof x === 'number' || typeof x !== typeof y) {
			throw new TypeError('SameValueNonNumber requires two non-number values of the same type.');
		}
		return this.SameValue(x, y);
	}
});

module.exports = ES7;

},{"./es6":7,"./helpers/assign":9}],7:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var hasSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';
var symbolToStr = hasSymbols ? Symbol.prototype.toString : toStr;

var $isNaN = require('./helpers/isNaN');
var $isFinite = require('./helpers/isFinite');
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

var assign = require('./helpers/assign');
var sign = require('./helpers/sign');
var mod = require('./helpers/mod');
var isPrimitive = require('./helpers/isPrimitive');
var toPrimitive = require('es-to-primitive/es6');
var parseInteger = parseInt;
var bind = require('function-bind');
var strSlice = bind.call(Function.call, String.prototype.slice);
var isBinary = bind.call(Function.call, RegExp.prototype.test, /^0b[01]+$/i);
var isOctal = bind.call(Function.call, RegExp.prototype.test, /^0o[0-7]+$/i);
var nonWS = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex = new RegExp('[' + nonWS + ']', 'g');
var hasNonWS = bind.call(Function.call, RegExp.prototype.test, nonWSregex);
var invalidHexLiteral = /^[\-\+]0x[0-9a-f]+$/i;
var isInvalidHexLiteral = bind.call(Function.call, RegExp.prototype.test, invalidHexLiteral);

// whitespace from: http://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws = [
	'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
	'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
	'\u2029\uFEFF'
].join('');
var trimRegex = new RegExp('(^[' + ws + ']+)|([' + ws + ']+$)', 'g');
var replace = bind.call(Function.call, String.prototype.replace);
var trim = function (value) {
	return replace(value, trimRegex, '');
};

var ES5 = require('./es5');

var hasRegExpMatcher = require('is-regex');

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-abstract-operations
var ES6 = assign(assign({}, ES5), {

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-call-f-v-args
	Call: function Call(F, V) {
		var args = arguments.length > 2 ? arguments[2] : [];
		if (!this.IsCallable(F)) {
			throw new TypeError(F + ' is not a function');
		}
		return F.apply(V, args);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toprimitive
	ToPrimitive: toPrimitive,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toboolean
	// ToBoolean: ES5.ToBoolean,

	// http://www.ecma-international.org/ecma-262/6.0/#sec-tonumber
	ToNumber: function ToNumber(argument) {
		var value = isPrimitive(argument) ? argument : toPrimitive(argument, 'number');
		if (typeof value === 'symbol') {
			throw new TypeError('Cannot convert a Symbol value to a number');
		}
		if (typeof value === 'string') {
			if (isBinary(value)) {
				return this.ToNumber(parseInteger(strSlice(value, 2), 2));
			} else if (isOctal(value)) {
				return this.ToNumber(parseInteger(strSlice(value, 2), 8));
			} else if (hasNonWS(value) || isInvalidHexLiteral(value)) {
				return NaN;
			} else {
				var trimmed = trim(value);
				if (trimmed !== value) {
					return this.ToNumber(trimmed);
				}
			}
		}
		return Number(value);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tointeger
	// ToInteger: ES5.ToNumber,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint32
	// ToInt32: ES5.ToInt32,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint32
	// ToUint32: ES5.ToUint32,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint16
	ToInt16: function ToInt16(argument) {
		var int16bit = this.ToUint16(argument);
		return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint16
	// ToUint16: ES5.ToUint16,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint8
	ToInt8: function ToInt8(argument) {
		var int8bit = this.ToUint8(argument);
		return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8
	ToUint8: function ToUint8(argument) {
		var number = this.ToNumber(argument);
		if ($isNaN(number) || number === 0 || !$isFinite(number)) { return 0; }
		var posInt = sign(number) * Math.floor(Math.abs(number));
		return mod(posInt, 0x100);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8clamp
	ToUint8Clamp: function ToUint8Clamp(argument) {
		var number = this.ToNumber(argument);
		if ($isNaN(number) || number <= 0) { return 0; }
		if (number >= 0xFF) { return 0xFF; }
		var f = Math.floor(argument);
		if (f + 0.5 < number) { return f + 1; }
		if (number < f + 0.5) { return f; }
		if (f % 2 !== 0) { return f + 1; }
		return f;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tostring
	ToString: function ToString(argument) {
		if (typeof argument === 'symbol') {
			throw new TypeError('Cannot convert a Symbol value to a string');
		}
		return String(argument);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toobject
	ToObject: function ToObject(value) {
		this.RequireObjectCoercible(value);
		return Object(value);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-topropertykey
	ToPropertyKey: function ToPropertyKey(argument) {
		var key = this.ToPrimitive(argument, String);
		return typeof key === 'symbol' ? symbolToStr.call(key) : this.ToString(key);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
	ToLength: function ToLength(argument) {
		var len = this.ToInteger(argument);
		if (len <= 0) { return 0; } // includes converting -0 to +0
		if (len > MAX_SAFE_INTEGER) { return MAX_SAFE_INTEGER; }
		return len;
	},

	// http://www.ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring
	CanonicalNumericIndexString: function CanonicalNumericIndexString(argument) {
		if (toStr.call(argument) !== '[object String]') {
			throw new TypeError('must be a string');
		}
		if (argument === '-0') { return -0; }
		var n = this.ToNumber(argument);
		if (this.SameValue(this.ToString(n), argument)) { return n; }
		return void 0;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-requireobjectcoercible
	RequireObjectCoercible: ES5.CheckObjectCoercible,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isarray
	IsArray: Array.isArray || function IsArray(argument) {
		return toStr.call(argument) === '[object Array]';
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-iscallable
	// IsCallable: ES5.IsCallable,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isconstructor
	IsConstructor: function IsConstructor(argument) {
		return this.IsCallable(argument); // unfortunately there's no way to truly check this without try/catch `new argument`
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isextensible-o
	IsExtensible: function IsExtensible(obj) {
		if (!Object.preventExtensions) { return true; }
		if (isPrimitive(obj)) {
			return false;
		}
		return Object.isExtensible(obj);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isinteger
	IsInteger: function IsInteger(argument) {
		if (typeof argument !== 'number' || $isNaN(argument) || !$isFinite(argument)) {
			return false;
		}
		var abs = Math.abs(argument);
		return Math.floor(abs) === abs;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ispropertykey
	IsPropertyKey: function IsPropertyKey(argument) {
		return typeof argument === 'string' || typeof argument === 'symbol';
	},

	// http://www.ecma-international.org/ecma-262/6.0/#sec-isregexp
	IsRegExp: function IsRegExp(argument) {
		if (!argument || typeof argument !== 'object') {
			return false;
		}
		if (hasSymbols) {
			var isRegExp = argument[Symbol.match];
			if (typeof isRegExp !== 'undefined') {
				return ES5.ToBoolean(isRegExp);
			}
		}
		return hasRegExpMatcher(argument);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevalue
	// SameValue: ES5.SameValue,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
	SameValueZero: function SameValueZero(x, y) {
		return (x === y) || ($isNaN(x) && $isNaN(y));
	}
});

delete ES6.CheckObjectCoercible; // renamed in ES6 to RequireObjectCoercible

module.exports = ES6;

},{"./es5":6,"./helpers/assign":9,"./helpers/isFinite":10,"./helpers/isNaN":11,"./helpers/isPrimitive":12,"./helpers/mod":13,"./helpers/sign":14,"es-to-primitive/es6":16,"function-bind":20,"is-regex":24}],24:[function(require,module,exports){
'use strict';

var regexExec = RegExp.prototype.exec;
var tryRegexExec = function tryRegexExec(value) {
	try {
		regexExec.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var regexClass = '[object RegExp]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isRegex(value) {
	if (typeof value !== 'object') { return false; }
	return hasToStringTag ? tryRegexExec(value) : toStr.call(value) === regexClass;
};

},{}],20:[function(require,module,exports){
var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":19}],19:[function(require,module,exports){
var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],16:[function(require,module,exports){
'use strict';

var hasSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';

var isPrimitive = require('./helpers/isPrimitive');
var isCallable = require('is-callable');
var isDate = require('is-date-object');
var isSymbol = require('is-symbol');

var ordinaryToPrimitive = function OrdinaryToPrimitive(O, hint) {
	if (typeof O === 'undefined' || O === null) {
		throw new TypeError('Cannot call method on ' + O);
	}
	if (typeof hint !== 'string' || (hint !== 'number' && hint !== 'string')) {
		throw new TypeError('hint must be "string" or "number"');
	}
	var methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
	var method, result, i;
	for (i = 0; i < methodNames.length; ++i) {
		method = O[methodNames[i]];
		if (isCallable(method)) {
			result = method.call(O);
			if (isPrimitive(result)) {
				return result;
			}
		}
	}
	throw new TypeError('No default value');
};

var GetMethod = function GetMethod(O, P) {
	var func = O[P];
	if (func !== null && typeof func !== 'undefined') {
		if (!isCallable(func)) {
			throw new TypeError(func + ' returned for property ' + P + ' of object ' + O + ' is not a function');
		}
		return func;
	}
};

// http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive
module.exports = function ToPrimitive(input, PreferredType) {
	if (isPrimitive(input)) {
		return input;
	}
	var hint = 'default';
	if (arguments.length > 1) {
		if (PreferredType === String) {
			hint = 'string';
		} else if (PreferredType === Number) {
			hint = 'number';
		}
	}

	var exoticToPrim;
	if (hasSymbols) {
		if (Symbol.toPrimitive) {
			exoticToPrim = GetMethod(input, Symbol.toPrimitive);
		} else if (isSymbol(input)) {
			exoticToPrim = Symbol.prototype.valueOf;
		}
	}
	if (typeof exoticToPrim !== 'undefined') {
		var result = exoticToPrim.call(input, hint);
		if (isPrimitive(result)) {
			return result;
		}
		throw new TypeError('unable to convert exotic object to primitive');
	}
	if (hint === 'default' && (isDate(input) || isSymbol(input))) {
		hint = 'string';
	}
	return ordinaryToPrimitive(input, hint === 'default' ? 'number' : hint);
};

},{"./helpers/isPrimitive":17,"is-callable":22,"is-date-object":23,"is-symbol":25}],25:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';

if (hasSymbols) {
	var symToStr = Symbol.prototype.toString;
	var symStringRegex = /^Symbol\(.*\)$/;
	var isSymbolObject = function isSymbolObject(value) {
		if (typeof value.valueOf() !== 'symbol') { return false; }
		return symStringRegex.test(symToStr.call(value));
	};
	module.exports = function isSymbol(value) {
		if (typeof value === 'symbol') { return true; }
		if (toStr.call(value) !== '[object Symbol]') { return false; }
		try {
			return isSymbolObject(value);
		} catch (e) {
			return false;
		}
	};
} else {
	module.exports = function isSymbol(value) {
		// this environment does not support Symbols.
		return false;
	};
}

},{}],23:[function(require,module,exports){
'use strict';

var getDay = Date.prototype.getDay;
var tryDateObject = function tryDateObject(value) {
	try {
		getDay.call(value);
		return true;
	} catch (e) {
		return false;
	}
};

var toStr = Object.prototype.toString;
var dateClass = '[object Date]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isDateObject(value) {
	if (typeof value !== 'object' || value === null) { return false; }
	return hasToStringTag ? tryDateObject(value) : toStr.call(value) === dateClass;
};

},{}],9:[function(require,module,exports){
var has = Object.prototype.hasOwnProperty;
module.exports = Object.assign || function assign(target, source) {
	for (var key in source) {
		if (has.call(source, key)) {
			target[key] = source[key];
		}
	}
	return target;
};

},{}],6:[function(require,module,exports){
'use strict';

var $isNaN = require('./helpers/isNaN');
var $isFinite = require('./helpers/isFinite');

var sign = require('./helpers/sign');
var mod = require('./helpers/mod');

var IsCallable = require('is-callable');
var toPrimitive = require('es-to-primitive/es5');

// https://es5.github.io/#x9
var ES5 = {
	ToPrimitive: toPrimitive,

	ToBoolean: function ToBoolean(value) {
		return Boolean(value);
	},
	ToNumber: function ToNumber(value) {
		return Number(value);
	},
	ToInteger: function ToInteger(value) {
		var number = this.ToNumber(value);
		if ($isNaN(number)) { return 0; }
		if (number === 0 || !$isFinite(number)) { return number; }
		return sign(number) * Math.floor(Math.abs(number));
	},
	ToInt32: function ToInt32(x) {
		return this.ToNumber(x) >> 0;
	},
	ToUint32: function ToUint32(x) {
		return this.ToNumber(x) >>> 0;
	},
	ToUint16: function ToUint16(value) {
		var number = this.ToNumber(value);
		if ($isNaN(number) || number === 0 || !$isFinite(number)) { return 0; }
		var posInt = sign(number) * Math.floor(Math.abs(number));
		return mod(posInt, 0x10000);
	},
	ToString: function ToString(value) {
		return String(value);
	},
	ToObject: function ToObject(value) {
		this.CheckObjectCoercible(value);
		return Object(value);
	},
	CheckObjectCoercible: function CheckObjectCoercible(value, optMessage) {
		/* jshint eqnull:true */
		if (value == null) {
			throw new TypeError(optMessage || 'Cannot call method on ' + value);
		}
		return value;
	},
	IsCallable: IsCallable,
	SameValue: function SameValue(x, y) {
		if (x === y) { // 0 === -0, but they are not identical.
			if (x === 0) { return 1 / x === 1 / y; }
			return true;
		}
		return $isNaN(x) && $isNaN(y);
	}
};

module.exports = ES5;

},{"./helpers/isFinite":10,"./helpers/isNaN":11,"./helpers/mod":13,"./helpers/sign":14,"es-to-primitive/es5":15,"is-callable":22}],15:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

var isPrimitive = require('./helpers/isPrimitive');

var isCallable = require('is-callable');

// https://es5.github.io/#x8.12
var ES5internalSlots = {
	'[[DefaultValue]]': function (O, hint) {
		var actualHint = hint || (toStr.call(O) === '[object Date]' ? String : Number);

		if (actualHint === String || actualHint === Number) {
			var methods = actualHint === String ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
			var value, i;
			for (i = 0; i < methods.length; ++i) {
				if (isCallable(O[methods[i]])) {
					value = O[methods[i]]();
					if (isPrimitive(value)) {
						return value;
					}
				}
			}
			throw new TypeError('No default value');
		}
		throw new TypeError('invalid [[DefaultValue]] hint supplied');
	}
};

// https://es5.github.io/#x9
module.exports = function ToPrimitive(input, PreferredType) {
	if (isPrimitive(input)) {
		return input;
	}
	return ES5internalSlots['[[DefaultValue]]'](input, PreferredType);
};

},{"./helpers/isPrimitive":17,"is-callable":22}],22:[function(require,module,exports){
'use strict';

var fnToStr = Function.prototype.toString;

var constructorRegex = /^\s*class /;
var isES6ClassFn = function isES6ClassFn(value) {
	try {
		var fnStr = fnToStr.call(value);
		var singleStripped = fnStr.replace(/\/\/.*\n/g, '');
		var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, '');
		var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' ');
		return constructorRegex.test(spaceStripped);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionObject(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isCallable(value) {
	if (!value) { return false; }
	if (typeof value !== 'function' && typeof value !== 'object') { return false; }
	if (hasToStringTag) { return tryFunctionObject(value); }
	if (isES6ClassFn(value)) { return false; }
	var strClass = toStr.call(value);
	return strClass === fnClass || strClass === genClass;
};

},{}],17:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],12:[function(require,module,exports){
module.exports = function isPrimitive(value) {
	return value === null || (typeof value !== 'function' && typeof value !== 'object');
};

},{}],14:[function(require,module,exports){
module.exports = function sign(number) {
	return number >= 0 ? 1 : -1;
};

},{}],13:[function(require,module,exports){
module.exports = function mod(number, modulo) {
	var remain = number % modulo;
	return Math.floor(remain >= 0 ? remain : remain + modulo);
};

},{}],11:[function(require,module,exports){
module.exports = Number.isNaN || function isNaN(a) {
	return a !== a;
};

},{}],10:[function(require,module,exports){
var $isNaN = Number.isNaN || function (a) { return a !== a; };

module.exports = Number.isFinite || function (x) { return typeof x === 'number' && !$isNaN(x) && x !== Infinity && x !== -Infinity; };

},{}],5:[function(require,module,exports){
'use strict';

var keys = require('object-keys');
var foreach = require('foreach');
var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';

var toStr = Object.prototype.toString;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
};

var arePropertyDescriptorsSupported = function () {
	var obj = {};
	try {
		Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
        /* eslint-disable no-unused-vars, no-restricted-syntax */
        for (var _ in obj) { return false; }
        /* eslint-enable no-unused-vars, no-restricted-syntax */
		return obj.x === obj;
	} catch (e) { /* this is IE 8. */
		return false;
	}
};
var supportsDescriptors = Object.defineProperty && arePropertyDescriptorsSupported();

var defineProperty = function (object, name, value, predicate) {
	if (name in object && (!isFunction(predicate) || !predicate())) {
		return;
	}
	if (supportsDescriptors) {
		Object.defineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value;
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = keys(map);
	if (hasSymbols) {
		props = props.concat(Object.getOwnPropertySymbols(map));
	}
	foreach(props, function (name) {
		defineProperty(object, name, map[name], predicates[name]);
	});
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

module.exports = defineProperties;

},{"foreach":18,"object-keys":26}],26:[function(require,module,exports){
'use strict';

// modified from https://github.com/es-shims/es5-shim
var has = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var slice = Array.prototype.slice;
var isArgs = require('./isArguments');
var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString');
var hasProtoEnumBug = function () {}.propertyIsEnumerable('prototype');
var dontEnums = [
	'toString',
	'toLocaleString',
	'valueOf',
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'constructor'
];
var equalsConstructorPrototype = function (o) {
	var ctor = o.constructor;
	return ctor && ctor.prototype === o;
};
var blacklistedKeys = {
	$console: true,
	$frame: true,
	$frameElement: true,
	$frames: true,
	$parent: true,
	$self: true,
	$webkitIndexedDB: true,
	$webkitStorageInfo: true,
	$window: true
};
var hasAutomationEqualityBug = (function () {
	/* global window */
	if (typeof window === 'undefined') { return false; }
	for (var k in window) {
		try {
			if (!blacklistedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
				try {
					equalsConstructorPrototype(window[k]);
				} catch (e) {
					return true;
				}
			}
		} catch (e) {
			return true;
		}
	}
	return false;
}());
var equalsConstructorPrototypeIfNotBuggy = function (o) {
	/* global window */
	if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
		return equalsConstructorPrototype(o);
	}
	try {
		return equalsConstructorPrototype(o);
	} catch (e) {
		return false;
	}
};

var keysShim = function keys(object) {
	var isObject = object !== null && typeof object === 'object';
	var isFunction = toStr.call(object) === '[object Function]';
	var isArguments = isArgs(object);
	var isString = isObject && toStr.call(object) === '[object String]';
	var theKeys = [];

	if (!isObject && !isFunction && !isArguments) {
		throw new TypeError('Object.keys called on a non-object');
	}

	var skipProto = hasProtoEnumBug && isFunction;
	if (isString && object.length > 0 && !has.call(object, 0)) {
		for (var i = 0; i < object.length; ++i) {
			theKeys.push(String(i));
		}
	}

	if (isArguments && object.length > 0) {
		for (var j = 0; j < object.length; ++j) {
			theKeys.push(String(j));
		}
	} else {
		for (var name in object) {
			if (!(skipProto && name === 'prototype') && has.call(object, name)) {
				theKeys.push(String(name));
			}
		}
	}

	if (hasDontEnumBug) {
		var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

		for (var k = 0; k < dontEnums.length; ++k) {
			if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
				theKeys.push(dontEnums[k]);
			}
		}
	}
	return theKeys;
};

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			return (Object.keys(arguments) || '').length === 2;
		}(1, 2));
		if (!keysWorksWithArguments) {
			var originalKeys = Object.keys;
			Object.keys = function keys(object) {
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				} else {
					return originalKeys(object);
				}
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;

},{"./isArguments":27}],27:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

},{}],18:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],1:[function(require,module,exports){
'use strict'

class CollectionMap extends Map {
  /**
   * A map that returns new collections when getting by a non-existing key
   * and removes empty collections from itself
   * @param  {Iterable} iterable
   * @param  {[type]} valueInitCtor Initial value constructor
   * @param  {[type]} valueSizeProp Property name used to check empty values
   * @return {CollectionMap}
   */
  constructor(valueInitCtor, valueSizeProp, iterable = undefined) {
    if (typeof valueInitCtor !== 'function') {
      throw TypeError('Missing initial value constructor')
    }
    if (typeof valueSizeProp !== 'string') {
      throw TypeError('Missing value size property')
    }
    super(iterable)
    Object.assign(this, {valueInitCtor, valueSizeProp})
  }
  get(key) {
    const value = super.get(key)
    return value === undefined ? new this.valueInitCtor() : value
  }
  set(key, value) {
    if (value[this.valueSizeProp] === 0) {
      this.delete(key)
    } else {
      super.set(key, value)
    }
    return this
  }
}

class ArrayMap extends CollectionMap {
  constructor(iterable = undefined) {
    super(Array, 'length', iterable)
  }
}

class MapMap extends CollectionMap {
  constructor(iterable = undefined) {
    super(Map, 'size', iterable)
  }
}

class SetMap extends CollectionMap {
  constructor(iterable = undefined) {
    super(Set, 'size', iterable)
  }
}

module.exports = {CollectionMap, ArrayMap, MapMap, SetMap}

},{}]},{},[43])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGJhY2tncm91bmQuanMiLCJzcmNcXFRhYnNcXFdpbmRvd01hcC5qcyIsInNyY1xcVGFic1xcaGFuZGxlcnMuanMiLCJzcmNcXFRhYnNcXFdpbmRvdy5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3QuZW50cmllcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3QuZW50cmllcy9zaGltLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC5lbnRyaWVzL3BvbHlmaWxsLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC5lbnRyaWVzL2ltcGxlbWVudGF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2hhcy9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXMtYWJzdHJhY3QvZXM3LmpzIiwibm9kZV9tb2R1bGVzL2VzLWFic3RyYWN0L2VzNi5qcyIsIm5vZGVfbW9kdWxlcy9pcy1yZWdleC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mdW5jdGlvbi1iaW5kL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Z1bmN0aW9uLWJpbmQvaW1wbGVtZW50YXRpb24uanMiLCJub2RlX21vZHVsZXMvZXMtdG8tcHJpbWl0aXZlL2VzNi5qcyIsIm5vZGVfbW9kdWxlcy9pcy1zeW1ib2wvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXMtZGF0ZS1vYmplY3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXMtYWJzdHJhY3QvaGVscGVycy9hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvZXMtYWJzdHJhY3QvZXM1LmpzIiwibm9kZV9tb2R1bGVzL2VzLXRvLXByaW1pdGl2ZS9lczUuanMiLCJub2RlX21vZHVsZXMvaXMtY2FsbGFibGUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXMtYWJzdHJhY3QvaGVscGVycy9pc1ByaW1pdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9lcy1hYnN0cmFjdC9oZWxwZXJzL3NpZ24uanMiLCJub2RlX21vZHVsZXMvZXMtYWJzdHJhY3QvaGVscGVycy9tb2QuanMiLCJub2RlX21vZHVsZXMvZXMtYWJzdHJhY3QvaGVscGVycy9pc05hTi5qcyIsIm5vZGVfbW9kdWxlcy9lcy1hYnN0cmFjdC9oZWxwZXJzL2lzRmluaXRlLmpzIiwibm9kZV9tb2R1bGVzL2RlZmluZS1wcm9wZXJ0aWVzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2lzQXJndW1lbnRzLmpzIiwibm9kZV9tb2R1bGVzL2ZvcmVhY2gvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQ29sbGVjdGlvbk1hcC9Db2xsZWN0aW9uTWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OzhCQ2dCQSxhQUFzQjtBQUNwQixXQUFPLE9BQVAsR0FBaUIsSUFBSSxTQUFKLENBQWMsT0FBTyxJQUFyQixDQUFqQjtBQUNBLFVBQU0sV0FBVyxNQUFNLE9BQU8sUUFBUCxDQUFnQixNQUFoQixFQUF2QjtBQUNBLFlBQVEsUUFBUixFQUFpQixNQUFNLE9BQU8sSUFBUCxDQUFZLEtBQVosQ0FBa0IsRUFBbEIsQ0FBdkI7O0FBRUEsUUFBSSxNQUFKLEVBQVksRUFBQyxRQUFELEVBQVcsT0FBWCxFQUFaOztBQUVBLFdBQU8sT0FBUCxDQUFlLFNBQWYsQ0FBeUIsV0FBekIsQ0FBcUMsVUFBQyxHQUFELEVBQU0sTUFBTixFQUFpQjtBQUNwRCxjQUFRLE1BQVI7QUFDQSxVQUFJLFNBQUosRUFBZSxHQUFmLEVBQW9CLE1BQXBCO0FBQ0QsS0FIRDs7QUFLQSxXQUFPLFFBQVAsQ0FBZ0IsU0FBaEIsQ0FBMEIsV0FBMUI7QUFBQSxrQ0FBc0MsV0FBZSxPQUFmLEVBQXdCO0FBQzVELFlBQUksUUFBUSxHQUFaLEVBQWlCOztBQUVmLGlCQUFPLElBQVAsQ0FBWSxXQUFaLENBQXdCLFFBQVEsR0FBUixDQUFZLEVBQXBDLEVBQXdDLE9BQXhDO0FBQ0E7QUFDRDtBQUNELGNB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Q0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiT2JqZWN0LmVudHJpZXMgPSByZXF1aXJlKCdvYmplY3QuZW50cmllcycpXG5cbmNvbnN0IHtsb2d9ID0gcmVxdWlyZSgnLi91dGlsJylcbmNvbnN0IHtXaW5kb3dNYXB9ID0gcmVxdWlyZSgnLi9UYWJzL1dpbmRvd01hcCcpXG5cbmNocm9tZSA9IHJlcXVpcmUoJ3Byb21pc2Vwcm94eS1jaHJvbWUnKShjaHJvbWUpXG5cbmNvbnN0IGFjdGlvbnMgPSB7XG4gIGFzeW5jIHJlbW92ZSgpIHtcbiAgICBpZiAoIXRoaXMudGFiKSByZXR1cm5cbiAgICBjb25zdCBuZXdBY3RpdmVJZCA9IGF3YWl0IGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRoaXMudGFiLmlkLCAnY2xvc2UnKVxuICAgIGNocm9tZS50YWJzLnVwZGF0ZShuZXdBY3RpdmVJZCwge2FjdGl2ZTogdHJ1ZX0pXG4gICAgY2hyb21lLnRhYnMucmVtb3ZlKHRoaXMudGFiLmlkKVxuICAgIHRoaXMudGFiID0gbnVsbFxuICB9LFxufVxuYXN5bmMgZnVuY3Rpb24gaW5pdCgpIHtcbiAgd2luZG93LndpbmRvd3MgPSBuZXcgV2luZG93TWFwKGNocm9tZS50YWJzKVxuICBjb25zdCBjb21tYW5kcyA9IGF3YWl0IGNocm9tZS5jb21tYW5kcy5nZXRBbGwoKVxuICB3aW5kb3dzLnBvcHVsYXRlKGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHt9KSlcblxuICBsb2coJ2luaXQnLCB7Y29tbWFuZHMsIHdpbmRvd3N9KVxuXG4gIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigoa2V5LCBzZW5kZXIpID0+IHtcbiAgICBhY3Rpb25zLnJlbW92ZSgpXG4gICAgbG9nKCdtZXNzYWdlJywga2V5LCBzZW5kZXIpXG4gIH0pXG5cbiAgY2hyb21lLmNvbW1hbmRzLm9uQ29tbWFuZC5hZGRMaXN0ZW5lcihhc3luYyBmdW5jdGlvbihjb21tYW5kKSB7XG4gICAgaWYgKGFjdGlvbnMudGFiKSB7XG4gICAgICAvLyBGb3J3YXJkIGNvbW1hbmRcbiAgICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGFjdGlvbnMudGFiLmlkLCBjb21tYW5kKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IFt7aW5kZXh9XSA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHtcbiAgICAgIGN1cnJlbnRXaW5kb3c6IHRydWUsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSlcbiAgICBhY3Rpb25zLnRhYiA9IGF3YWl0IGNocm9tZS50YWJzLmNyZWF0ZSh7XG4gICAgICB1cmw6IGNocm9tZS5leHRlbnNpb24uZ2V0VVJMKGBzd2l0Y2hlci5odG1sIyR7Y29tbWFuZH1gKSxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgIGluZGV4OiBpbmRleCArIDEsXG4gICAgfSlcbiAgICBsb2coJ2NvbW1hbmQnLCBjb21tYW5kKVxuICB9KVxufVxuXG5jaHJvbWUucnVudGltZS5vblN0YXJ0dXAuYWRkTGlzdGVuZXIoaW5pdClcbmNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKGluaXQpXG5cbi8qXG5jb25zdCBtb2RLZXlzID0gWydzaGlmdCcsICdhbHQnLCAnY3RybCcsICdtZXRhJ11cblxuZnVuY3Rpb24gcGFyc2VTaG9ydGN1dCh0ZXh0KSB7XG4gIHJldHVybiB0ZXh0LnNwbGl0KCcrJylcbiAgICAgIC5tYXAoeCA9PiB4LnRvTG93ZXJDYXNlKCkpXG4gICAgICAuZmlsdGVyKHggPT4gbW9kS2V5cy5pbmNsdWRlcyh4KSlcbn1cbiovXG4iLCJjb25zdCB7Q29sbGVjdGlvbk1hcH0gPSByZXF1aXJlKCdDb2xsZWN0aW9uTWFwJylcblxuY29uc3QgaGFuZGxlcnMgPSByZXF1aXJlKCcuL2hhbmRsZXJzJylcbmNvbnN0IHtXaW5kb3d9ID0gcmVxdWlyZSgnLi9XaW5kb3cnKVxuXG5jbGFzcyBXaW5kb3dNYXAgZXh0ZW5kcyBDb2xsZWN0aW9uTWFwIHtcbiAgY29uc3RydWN0b3IoY2hyb21lVGFicykge1xuICAgIHN1cGVyKFdpbmRvdywgJ3NpemUnKVxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuaGFuZGxlcnMpLmZvckVhY2goKFtuYW1lLCBoYW5kbGVyXSkgPT4ge1xuICAgICAgY2hyb21lVGFic1tuYW1lXS5hZGRMaXN0ZW5lcihoYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfSlcbiAgfVxuICB1cGRhdGUobWV0aG9kLCB0YWJJZCwgd2luZG93SWQpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQod2luZG93SWQsIHRoaXMuZ2V0KHdpbmRvd0lkKVttZXRob2RdKHRhYklkKSlcbiAgfVxuICBhcHBlbmQodGFiSWQsIHdpbmRvd0lkKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlKCdhcHBlbmQnLCB0YWJJZCwgd2luZG93SWQpXG4gIH1cbiAgcHJlcGVuZCh0YWJJZCwgd2luZG93SWQpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGUoJ3ByZXBlbmQnLCB0YWJJZCwgd2luZG93SWQpXG4gIH1cbiAgcmVtb3ZlKHRhYklkLCB3aW5kb3dJZCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZSgncmVtb3ZlJywgdGFiSWQsIHdpbmRvd0lkKVxuICB9XG4gIHBvcHVsYXRlKHRhYnMpIHtcbiAgICB0YWJzLmZvckVhY2goKHtpZCwgd2luZG93SWR9KSA9PiB0aGlzLmFwcGVuZChpZCwgd2luZG93SWQpKVxuICAgIHJldHVybiB0aGlzXG4gIH1cbn1cblxuT2JqZWN0LmFzc2lnbihXaW5kb3dNYXAucHJvdG90eXBlLCB7aGFuZGxlcnN9KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtXaW5kb3dNYXB9XG4iLCJjb25zdCB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5jb25zdCBsb2cgPSAoLi4uYXJncykgPT4gdXRpbC5sb2coJ3RhYicsIC4uLmFyZ3MpXG5cbmNvbnN0IGhhbmRsZXJzID0ge1xuICBvbkNyZWF0ZWQoe2lkLCB3aW5kb3dJZH0pIHtcbiAgICB0aGlzLmFwcGVuZChpZCwgd2luZG93SWQpXG4gIH0sXG4gIG9uUmVtb3ZlZCh0YWJJZCwge3dpbmRvd0lkfSkge1xuICAgIHRoaXMucmVtb3ZlKHRhYklkLCB3aW5kb3dJZClcbiAgfSxcbiAgb25EZXRhY2hlZCh0YWJJZCwge29sZFdpbmRvd0lkfSkge1xuICAgIHRoaXMucmVtb3ZlKHRhYklkLCBvbGRXaW5kb3dJZClcbiAgfSxcbiAgb25BdHRhY2hlZCh0YWJJZCwge25ld1dpbmRvd0lkfSkge1xuICAgIHRoaXMuYXBwZW5kKHRhYklkLCBuZXdXaW5kb3dJZClcbiAgfSxcbiAgb25BY3RpdmF0ZWQoe3RhYklkLCB3aW5kb3dJZH0pIHtcbiAgICB0aGlzLnJlbW92ZSh0YWJJZCwgd2luZG93SWQpXG4gICAgdGhpcy5wcmVwZW5kKHRhYklkLCB3aW5kb3dJZClcbiAgfSxcbiAgb25SZXBsYWNlZCh0YWJJZCwge2FkZGVkVGFiSWQsIHJlbW92ZWRUYWJJZH0pIHtcbiAgICBsb2coJ3JlcGxhY2VkJywge3RhYklkLCBhZGRlZFRhYklkLCByZW1vdmVkVGFiSWR9KVxuICB9LFxufVxuXG5jb25zdCBkZWJ1ZyA9IHRydWVcbmlmIChkZWJ1Zykge1xuICBPYmplY3QuZW50cmllcyhoYW5kbGVycykuZm9yRWFjaCgoW2ssIGZuXSkgPT4ge1xuICAgIGhhbmRsZXJzW2tdID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgbG9nKGssIC4uLmFyZ3MpXG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmdzKVxuICAgIH1cbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoYW5kbGVyc1xuIiwiY29uc3Qge0NpcmN1bGF0b3J9ID0gcmVxdWlyZSgnY2lyY3VsYXRvcicpXG5cbmNsYXNzIFdpbmRvdyBleHRlbmRzIENpcmN1bGF0b3Ige1xuICBwcmVwZW5kKHRhYklkKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKFt0YWJJZF0uY29uY2F0KFsuLi50aGlzXSkpXG4gIH1cbiAgYXBwZW5kKHRhYklkKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKFsuLi50aGlzXS5jb25jYXQodGFiSWQpKVxuICB9XG4gIHJlbW92ZSh0YWJJZCkge1xuICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3RvcihbLi4udGhpc10uZmlsdGVyKHggPT4geCAhPT0gdGFiSWQpKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1dpbmRvd31cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmluZSA9IHJlcXVpcmUoJ2RlZmluZS1wcm9wZXJ0aWVzJyk7XG5cbnZhciBpbXBsZW1lbnRhdGlvbiA9IHJlcXVpcmUoJy4vaW1wbGVtZW50YXRpb24nKTtcbnZhciBnZXRQb2x5ZmlsbCA9IHJlcXVpcmUoJy4vcG9seWZpbGwnKTtcbnZhciBzaGltID0gcmVxdWlyZSgnLi9zaGltJyk7XG5cbmRlZmluZShpbXBsZW1lbnRhdGlvbiwge1xuXHRnZXRQb2x5ZmlsbDogZ2V0UG9seWZpbGwsXG5cdGltcGxlbWVudGF0aW9uOiBpbXBsZW1lbnRhdGlvbixcblx0c2hpbTogc2hpbVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW1wbGVtZW50YXRpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRQb2x5ZmlsbCA9IHJlcXVpcmUoJy4vcG9seWZpbGwnKTtcbnZhciBkZWZpbmUgPSByZXF1aXJlKCdkZWZpbmUtcHJvcGVydGllcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNoaW1FbnRyaWVzKCkge1xuXHR2YXIgcG9seWZpbGwgPSBnZXRQb2x5ZmlsbCgpO1xuXHRkZWZpbmUoT2JqZWN0LCB7IGVudHJpZXM6IHBvbHlmaWxsIH0sIHsgZW50cmllczogZnVuY3Rpb24gKCkgeyByZXR1cm4gT2JqZWN0LmVudHJpZXMgIT09IHBvbHlmaWxsOyB9IH0pO1xuXHRyZXR1cm4gcG9seWZpbGw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW1wbGVtZW50YXRpb24gPSByZXF1aXJlKCcuL2ltcGxlbWVudGF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0UG9seWZpbGwoKSB7XG5cdHJldHVybiB0eXBlb2YgT2JqZWN0LmVudHJpZXMgPT09ICdmdW5jdGlvbicgPyBPYmplY3QuZW50cmllcyA6IGltcGxlbWVudGF0aW9uO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVTID0gcmVxdWlyZSgnZXMtYWJzdHJhY3QvZXM3Jyk7XG52YXIgaGFzID0gcmVxdWlyZSgnaGFzJyk7XG52YXIgYmluZCA9IHJlcXVpcmUoJ2Z1bmN0aW9uLWJpbmQnKTtcbnZhciBpc0VudW1lcmFibGUgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZW50cmllcyhPKSB7XG5cdHZhciBvYmogPSBFUy5SZXF1aXJlT2JqZWN0Q29lcmNpYmxlKE8pO1xuXHR2YXIgZW50cnlzID0gW107XG5cdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRpZiAoaGFzKG9iaiwga2V5KSAmJiBpc0VudW1lcmFibGUob2JqLCBrZXkpKSB7XG5cdFx0XHRlbnRyeXMucHVzaChba2V5LCBvYmpba2V5XV0pO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZW50cnlzO1xufTtcbiIsInZhciBiaW5kID0gcmVxdWlyZSgnZnVuY3Rpb24tYmluZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJpbmQuY2FsbChGdW5jdGlvbi5jYWxsLCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVTNiA9IHJlcXVpcmUoJy4vZXM2Jyk7XG52YXIgYXNzaWduID0gcmVxdWlyZSgnLi9oZWxwZXJzL2Fzc2lnbicpO1xuXG52YXIgRVM3ID0gYXNzaWduKEVTNiwge1xuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vdGMzOS9lY21hMjYyL3B1bGwvNjBcblx0U2FtZVZhbHVlTm9uTnVtYmVyOiBmdW5jdGlvbiBTYW1lVmFsdWVOb25OdW1iZXIoeCwgeSkge1xuXHRcdGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHggIT09IHR5cGVvZiB5KSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdTYW1lVmFsdWVOb25OdW1iZXIgcmVxdWlyZXMgdHdvIG5vbi1udW1iZXIgdmFsdWVzIG9mIHRoZSBzYW1lIHR5cGUuJyk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLlNhbWVWYWx1ZSh4LCB5KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRVM3O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIGhhc1N5bWJvbHMgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09ICdzeW1ib2wnO1xudmFyIHN5bWJvbFRvU3RyID0gaGFzU3ltYm9scyA/IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcgOiB0b1N0cjtcblxudmFyICRpc05hTiA9IHJlcXVpcmUoJy4vaGVscGVycy9pc05hTicpO1xudmFyICRpc0Zpbml0ZSA9IHJlcXVpcmUoJy4vaGVscGVycy9pc0Zpbml0ZScpO1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiB8fCBNYXRoLnBvdygyLCA1MykgLSAxO1xuXG52YXIgYXNzaWduID0gcmVxdWlyZSgnLi9oZWxwZXJzL2Fzc2lnbicpO1xudmFyIHNpZ24gPSByZXF1aXJlKCcuL2hlbHBlcnMvc2lnbicpO1xudmFyIG1vZCA9IHJlcXVpcmUoJy4vaGVscGVycy9tb2QnKTtcbnZhciBpc1ByaW1pdGl2ZSA9IHJlcXVpcmUoJy4vaGVscGVycy9pc1ByaW1pdGl2ZScpO1xudmFyIHRvUHJpbWl0aXZlID0gcmVxdWlyZSgnZXMtdG8tcHJpbWl0aXZlL2VzNicpO1xudmFyIHBhcnNlSW50ZWdlciA9IHBhcnNlSW50O1xudmFyIGJpbmQgPSByZXF1aXJlKCdmdW5jdGlvbi1iaW5kJyk7XG52YXIgc3RyU2xpY2UgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgU3RyaW5nLnByb3RvdHlwZS5zbGljZSk7XG52YXIgaXNCaW5hcnkgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgUmVnRXhwLnByb3RvdHlwZS50ZXN0LCAvXjBiWzAxXSskL2kpO1xudmFyIGlzT2N0YWwgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgUmVnRXhwLnByb3RvdHlwZS50ZXN0LCAvXjBvWzAtN10rJC9pKTtcbnZhciBub25XUyA9IFsnXFx1MDA4NScsICdcXHUyMDBiJywgJ1xcdWZmZmUnXS5qb2luKCcnKTtcbnZhciBub25XU3JlZ2V4ID0gbmV3IFJlZ0V4cCgnWycgKyBub25XUyArICddJywgJ2cnKTtcbnZhciBoYXNOb25XUyA9IGJpbmQuY2FsbChGdW5jdGlvbi5jYWxsLCBSZWdFeHAucHJvdG90eXBlLnRlc3QsIG5vbldTcmVnZXgpO1xudmFyIGludmFsaWRIZXhMaXRlcmFsID0gL15bXFwtXFwrXTB4WzAtOWEtZl0rJC9pO1xudmFyIGlzSW52YWxpZEhleExpdGVyYWwgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgUmVnRXhwLnByb3RvdHlwZS50ZXN0LCBpbnZhbGlkSGV4TGl0ZXJhbCk7XG5cbi8vIHdoaXRlc3BhY2UgZnJvbTogaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS41LjQuMjBcbi8vIGltcGxlbWVudGF0aW9uIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2VzLXNoaW1zL2VzNS1zaGltL2Jsb2IvdjMuNC4wL2VzNS1zaGltLmpzI0wxMzA0LUwxMzI0XG52YXIgd3MgPSBbXG5cdCdcXHgwOVxceDBBXFx4MEJcXHgwQ1xceDBEXFx4MjBcXHhBMFxcdTE2ODBcXHUxODBFXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwMycsXG5cdCdcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBBXFx1MjAyRlxcdTIwNUZcXHUzMDAwXFx1MjAyOCcsXG5cdCdcXHUyMDI5XFx1RkVGRidcbl0uam9pbignJyk7XG52YXIgdHJpbVJlZ2V4ID0gbmV3IFJlZ0V4cCgnKF5bJyArIHdzICsgJ10rKXwoWycgKyB3cyArICddKyQpJywgJ2cnKTtcbnZhciByZXBsYWNlID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIFN0cmluZy5wcm90b3R5cGUucmVwbGFjZSk7XG52YXIgdHJpbSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRyZXR1cm4gcmVwbGFjZSh2YWx1ZSwgdHJpbVJlZ2V4LCAnJyk7XG59O1xuXG52YXIgRVM1ID0gcmVxdWlyZSgnLi9lczUnKTtcblxudmFyIGhhc1JlZ0V4cE1hdGNoZXIgPSByZXF1aXJlKCdpcy1yZWdleCcpO1xuXG4vLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtYWJzdHJhY3Qtb3BlcmF0aW9uc1xudmFyIEVTNiA9IGFzc2lnbihhc3NpZ24oe30sIEVTNSksIHtcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtY2FsbC1mLXYtYXJnc1xuXHRDYWxsOiBmdW5jdGlvbiBDYWxsKEYsIFYpIHtcblx0XHR2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXJndW1lbnRzWzJdIDogW107XG5cdFx0aWYgKCF0aGlzLklzQ2FsbGFibGUoRikpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoRiArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcblx0XHR9XG5cdFx0cmV0dXJuIEYuYXBwbHkoViwgYXJncyk7XG5cdH0sXG5cblx0Ly8gaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLXRvcHJpbWl0aXZlXG5cdFRvUHJpbWl0aXZlOiB0b1ByaW1pdGl2ZSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtdG9ib29sZWFuXG5cdC8vIFRvQm9vbGVhbjogRVM1LlRvQm9vbGVhbixcblxuXHQvLyBodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9udW1iZXJcblx0VG9OdW1iZXI6IGZ1bmN0aW9uIFRvTnVtYmVyKGFyZ3VtZW50KSB7XG5cdFx0dmFyIHZhbHVlID0gaXNQcmltaXRpdmUoYXJndW1lbnQpID8gYXJndW1lbnQgOiB0b1ByaW1pdGl2ZShhcmd1bWVudCwgJ251bWJlcicpO1xuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdzeW1ib2wnKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCBhIFN5bWJvbCB2YWx1ZSB0byBhIG51bWJlcicpO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuXHRcdFx0aWYgKGlzQmluYXJ5KHZhbHVlKSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5Ub051bWJlcihwYXJzZUludGVnZXIoc3RyU2xpY2UodmFsdWUsIDIpLCAyKSk7XG5cdFx0XHR9IGVsc2UgaWYgKGlzT2N0YWwodmFsdWUpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLlRvTnVtYmVyKHBhcnNlSW50ZWdlcihzdHJTbGljZSh2YWx1ZSwgMiksIDgpKTtcblx0XHRcdH0gZWxzZSBpZiAoaGFzTm9uV1ModmFsdWUpIHx8IGlzSW52YWxpZEhleExpdGVyYWwodmFsdWUpKSB7XG5cdFx0XHRcdHJldHVybiBOYU47XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgdHJpbW1lZCA9IHRyaW0odmFsdWUpO1xuXHRcdFx0XHRpZiAodHJpbW1lZCAhPT0gdmFsdWUpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5Ub051bWJlcih0cmltbWVkKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gTnVtYmVyKHZhbHVlKTtcblx0fSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtdG9pbnRlZ2VyXG5cdC8vIFRvSW50ZWdlcjogRVM1LlRvTnVtYmVyLFxuXG5cdC8vIGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy10b2ludDMyXG5cdC8vIFRvSW50MzI6IEVTNS5Ub0ludDMyLFxuXG5cdC8vIGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy10b3VpbnQzMlxuXHQvLyBUb1VpbnQzMjogRVM1LlRvVWludDMyLFxuXG5cdC8vIGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy10b2ludDE2XG5cdFRvSW50MTY6IGZ1bmN0aW9uIFRvSW50MTYoYXJndW1lbnQpIHtcblx0XHR2YXIgaW50MTZiaXQgPSB0aGlzLlRvVWludDE2KGFyZ3VtZW50KTtcblx0XHRyZXR1cm4gaW50MTZiaXQgPj0gMHg4MDAwID8gaW50MTZiaXQgLSAweDEwMDAwIDogaW50MTZiaXQ7XG5cdH0sXG5cblx0Ly8gaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLXRvdWludDE2XG5cdC8vIFRvVWludDE2OiBFUzUuVG9VaW50MTYsXG5cblx0Ly8gaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLXRvaW50OFxuXHRUb0ludDg6IGZ1bmN0aW9uIFRvSW50OChhcmd1bWVudCkge1xuXHRcdHZhciBpbnQ4Yml0ID0gdGhpcy5Ub1VpbnQ4KGFyZ3VtZW50KTtcblx0XHRyZXR1cm4gaW50OGJpdCA+PSAweDgwID8gaW50OGJpdCAtIDB4MTAwIDogaW50OGJpdDtcblx0fSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtdG91aW50OFxuXHRUb1VpbnQ4OiBmdW5jdGlvbiBUb1VpbnQ4KGFyZ3VtZW50KSB7XG5cdFx0dmFyIG51bWJlciA9IHRoaXMuVG9OdW1iZXIoYXJndW1lbnQpO1xuXHRcdGlmICgkaXNOYU4obnVtYmVyKSB8fCBudW1iZXIgPT09IDAgfHwgISRpc0Zpbml0ZShudW1iZXIpKSB7IHJldHVybiAwOyB9XG5cdFx0dmFyIHBvc0ludCA9IHNpZ24obnVtYmVyKSAqIE1hdGguZmxvb3IoTWF0aC5hYnMobnVtYmVyKSk7XG5cdFx0cmV0dXJuIG1vZChwb3NJbnQsIDB4MTAwKTtcblx0fSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtdG91aW50OGNsYW1wXG5cdFRvVWludDhDbGFtcDogZnVuY3Rpb24gVG9VaW50OENsYW1wKGFyZ3VtZW50KSB7XG5cdFx0dmFyIG51bWJlciA9IHRoaXMuVG9OdW1iZXIoYXJndW1lbnQpO1xuXHRcdGlmICgkaXNOYU4obnVtYmVyKSB8fCBudW1iZXIgPD0gMCkgeyByZXR1cm4gMDsgfVxuXHRcdGlmIChudW1iZXIgPj0gMHhGRikgeyByZXR1cm4gMHhGRjsgfVxuXHRcdHZhciBmID0gTWF0aC5mbG9vcihhcmd1bWVudCk7XG5cdFx0aWYgKGYgKyAwLjUgPCBudW1iZXIpIHsgcmV0dXJuIGYgKyAxOyB9XG5cdFx0aWYgKG51bWJlciA8IGYgKyAwLjUpIHsgcmV0dXJuIGY7IH1cblx0XHRpZiAoZiAlIDIgIT09IDApIHsgcmV0dXJuIGYgKyAxOyB9XG5cdFx0cmV0dXJuIGY7XG5cdH0sXG5cblx0Ly8gaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLXRvc3RyaW5nXG5cdFRvU3RyaW5nOiBmdW5jdGlvbiBUb1N0cmluZyhhcmd1bWVudCkge1xuXHRcdGlmICh0eXBlb2YgYXJndW1lbnQgPT09ICdzeW1ib2wnKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCBhIFN5bWJvbCB2YWx1ZSB0byBhIHN0cmluZycpO1xuXHRcdH1cblx0XHRyZXR1cm4gU3RyaW5nKGFyZ3VtZW50KTtcblx0fSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtdG9vYmplY3Rcblx0VG9PYmplY3Q6IGZ1bmN0aW9uIFRvT2JqZWN0KHZhbHVlKSB7XG5cdFx0dGhpcy5SZXF1aXJlT2JqZWN0Q29lcmNpYmxlKHZhbHVlKTtcblx0XHRyZXR1cm4gT2JqZWN0KHZhbHVlKTtcblx0fSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtdG9wcm9wZXJ0eWtleVxuXHRUb1Byb3BlcnR5S2V5OiBmdW5jdGlvbiBUb1Byb3BlcnR5S2V5KGFyZ3VtZW50KSB7XG5cdFx0dmFyIGtleSA9IHRoaXMuVG9QcmltaXRpdmUoYXJndW1lbnQsIFN0cmluZyk7XG5cdFx0cmV0dXJuIHR5cGVvZiBrZXkgPT09ICdzeW1ib2wnID8gc3ltYm9sVG9TdHIuY2FsbChrZXkpIDogdGhpcy5Ub1N0cmluZyhrZXkpO1xuXHR9LFxuXG5cdC8vIGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy10b2xlbmd0aFxuXHRUb0xlbmd0aDogZnVuY3Rpb24gVG9MZW5ndGgoYXJndW1lbnQpIHtcblx0XHR2YXIgbGVuID0gdGhpcy5Ub0ludGVnZXIoYXJndW1lbnQpO1xuXHRcdGlmIChsZW4gPD0gMCkgeyByZXR1cm4gMDsgfSAvLyBpbmNsdWRlcyBjb252ZXJ0aW5nIC0wIHRvICswXG5cdFx0aWYgKGxlbiA+IE1BWF9TQUZFX0lOVEVHRVIpIHsgcmV0dXJuIE1BWF9TQUZFX0lOVEVHRVI7IH1cblx0XHRyZXR1cm4gbGVuO1xuXHR9LFxuXG5cdC8vIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1jYW5vbmljYWxudW1lcmljaW5kZXhzdHJpbmdcblx0Q2Fub25pY2FsTnVtZXJpY0luZGV4U3RyaW5nOiBmdW5jdGlvbiBDYW5vbmljYWxOdW1lcmljSW5kZXhTdHJpbmcoYXJndW1lbnQpIHtcblx0XHRpZiAodG9TdHIuY2FsbChhcmd1bWVudCkgIT09ICdbb2JqZWN0IFN0cmluZ10nKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IGJlIGEgc3RyaW5nJyk7XG5cdFx0fVxuXHRcdGlmIChhcmd1bWVudCA9PT0gJy0wJykgeyByZXR1cm4gLTA7IH1cblx0XHR2YXIgbiA9IHRoaXMuVG9OdW1iZXIoYXJndW1lbnQpO1xuXHRcdGlmICh0aGlzLlNhbWVWYWx1ZSh0aGlzLlRvU3RyaW5nKG4pLCBhcmd1bWVudCkpIHsgcmV0dXJuIG47IH1cblx0XHRyZXR1cm4gdm9pZCAwO1xuXHR9LFxuXG5cdC8vIGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy1yZXF1aXJlb2JqZWN0Y29lcmNpYmxlXG5cdFJlcXVpcmVPYmplY3RDb2VyY2libGU6IEVTNS5DaGVja09iamVjdENvZXJjaWJsZSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtaXNhcnJheVxuXHRJc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIElzQXJyYXkoYXJndW1lbnQpIHtcblx0XHRyZXR1cm4gdG9TdHIuY2FsbChhcmd1bWVudCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdH0sXG5cblx0Ly8gaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLWlzY2FsbGFibGVcblx0Ly8gSXNDYWxsYWJsZTogRVM1LklzQ2FsbGFibGUsXG5cblx0Ly8gaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLWlzY29uc3RydWN0b3Jcblx0SXNDb25zdHJ1Y3RvcjogZnVuY3Rpb24gSXNDb25zdHJ1Y3Rvcihhcmd1bWVudCkge1xuXHRcdHJldHVybiB0aGlzLklzQ2FsbGFibGUoYXJndW1lbnQpOyAvLyB1bmZvcnR1bmF0ZWx5IHRoZXJlJ3Mgbm8gd2F5IHRvIHRydWx5IGNoZWNrIHRoaXMgd2l0aG91dCB0cnkvY2F0Y2ggYG5ldyBhcmd1bWVudGBcblx0fSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtaXNleHRlbnNpYmxlLW9cblx0SXNFeHRlbnNpYmxlOiBmdW5jdGlvbiBJc0V4dGVuc2libGUob2JqKSB7XG5cdFx0aWYgKCFPYmplY3QucHJldmVudEV4dGVuc2lvbnMpIHsgcmV0dXJuIHRydWU7IH1cblx0XHRpZiAoaXNQcmltaXRpdmUob2JqKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gT2JqZWN0LmlzRXh0ZW5zaWJsZShvYmopO1xuXHR9LFxuXG5cdC8vIGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy1pc2ludGVnZXJcblx0SXNJbnRlZ2VyOiBmdW5jdGlvbiBJc0ludGVnZXIoYXJndW1lbnQpIHtcblx0XHRpZiAodHlwZW9mIGFyZ3VtZW50ICE9PSAnbnVtYmVyJyB8fCAkaXNOYU4oYXJndW1lbnQpIHx8ICEkaXNGaW5pdGUoYXJndW1lbnQpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHZhciBhYnMgPSBNYXRoLmFicyhhcmd1bWVudCk7XG5cdFx0cmV0dXJuIE1hdGguZmxvb3IoYWJzKSA9PT0gYWJzO1xuXHR9LFxuXG5cdC8vIGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy1pc3Byb3BlcnR5a2V5XG5cdElzUHJvcGVydHlLZXk6IGZ1bmN0aW9uIElzUHJvcGVydHlLZXkoYXJndW1lbnQpIHtcblx0XHRyZXR1cm4gdHlwZW9mIGFyZ3VtZW50ID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgYXJndW1lbnQgPT09ICdzeW1ib2wnO1xuXHR9LFxuXG5cdC8vIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1pc3JlZ2V4cFxuXHRJc1JlZ0V4cDogZnVuY3Rpb24gSXNSZWdFeHAoYXJndW1lbnQpIHtcblx0XHRpZiAoIWFyZ3VtZW50IHx8IHR5cGVvZiBhcmd1bWVudCAhPT0gJ29iamVjdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0aWYgKGhhc1N5bWJvbHMpIHtcblx0XHRcdHZhciBpc1JlZ0V4cCA9IGFyZ3VtZW50W1N5bWJvbC5tYXRjaF07XG5cdFx0XHRpZiAodHlwZW9mIGlzUmVnRXhwICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRyZXR1cm4gRVM1LlRvQm9vbGVhbihpc1JlZ0V4cCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBoYXNSZWdFeHBNYXRjaGVyKGFyZ3VtZW50KTtcblx0fSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtc2FtZXZhbHVlXG5cdC8vIFNhbWVWYWx1ZTogRVM1LlNhbWVWYWx1ZSxcblxuXHQvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtc2FtZXZhbHVlemVyb1xuXHRTYW1lVmFsdWVaZXJvOiBmdW5jdGlvbiBTYW1lVmFsdWVaZXJvKHgsIHkpIHtcblx0XHRyZXR1cm4gKHggPT09IHkpIHx8ICgkaXNOYU4oeCkgJiYgJGlzTmFOKHkpKTtcblx0fVxufSk7XG5cbmRlbGV0ZSBFUzYuQ2hlY2tPYmplY3RDb2VyY2libGU7IC8vIHJlbmFtZWQgaW4gRVM2IHRvIFJlcXVpcmVPYmplY3RDb2VyY2libGVcblxubW9kdWxlLmV4cG9ydHMgPSBFUzY7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByZWdleEV4ZWMgPSBSZWdFeHAucHJvdG90eXBlLmV4ZWM7XG52YXIgdHJ5UmVnZXhFeGVjID0gZnVuY3Rpb24gdHJ5UmVnZXhFeGVjKHZhbHVlKSB7XG5cdHRyeSB7XG5cdFx0cmVnZXhFeGVjLmNhbGwodmFsdWUpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59O1xudmFyIHRvU3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciByZWdleENsYXNzID0gJ1tvYmplY3QgUmVnRXhwXSc7XG52YXIgaGFzVG9TdHJpbmdUYWcgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wudG9TdHJpbmdUYWcgPT09ICdzeW1ib2wnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzUmVnZXgodmFsdWUpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdHJldHVybiBoYXNUb1N0cmluZ1RhZyA/IHRyeVJlZ2V4RXhlYyh2YWx1ZSkgOiB0b1N0ci5jYWxsKHZhbHVlKSA9PT0gcmVnZXhDbGFzcztcbn07XG4iLCJ2YXIgaW1wbGVtZW50YXRpb24gPSByZXF1aXJlKCcuL2ltcGxlbWVudGF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgfHwgaW1wbGVtZW50YXRpb247XG4iLCJ2YXIgRVJST1JfTUVTU0FHRSA9ICdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCBjYWxsZWQgb24gaW5jb21wYXRpYmxlICc7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIGZ1bmNUeXBlID0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiaW5kKHRoYXQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcztcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJyB8fCB0b1N0ci5jYWxsKHRhcmdldCkgIT09IGZ1bmNUeXBlKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRVJST1JfTUVTU0FHRSArIHRhcmdldCk7XG4gICAgfVxuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGJvdW5kO1xuICAgIHZhciBiaW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgYm91bmQpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0YXJnZXQuYXBwbHkoXG4gICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0LmFwcGx5KFxuICAgICAgICAgICAgICAgIHRoYXQsXG4gICAgICAgICAgICAgICAgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgYm91bmRMZW5ndGggPSBNYXRoLm1heCgwLCB0YXJnZXQubGVuZ3RoIC0gYXJncy5sZW5ndGgpO1xuICAgIHZhciBib3VuZEFyZ3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJvdW5kTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYm91bmRBcmdzLnB1c2goJyQnICsgaSk7XG4gICAgfVxuXG4gICAgYm91bmQgPSBGdW5jdGlvbignYmluZGVyJywgJ3JldHVybiBmdW5jdGlvbiAoJyArIGJvdW5kQXJncy5qb2luKCcsJykgKyAnKXsgcmV0dXJuIGJpbmRlci5hcHBseSh0aGlzLGFyZ3VtZW50cyk7IH0nKShiaW5kZXIpO1xuXG4gICAgaWYgKHRhcmdldC5wcm90b3R5cGUpIHtcbiAgICAgICAgdmFyIEVtcHR5ID0gZnVuY3Rpb24gRW1wdHkoKSB7fTtcbiAgICAgICAgRW1wdHkucHJvdG90eXBlID0gdGFyZ2V0LnByb3RvdHlwZTtcbiAgICAgICAgYm91bmQucHJvdG90eXBlID0gbmV3IEVtcHR5KCk7XG4gICAgICAgIEVtcHR5LnByb3RvdHlwZSA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJvdW5kO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc1N5bWJvbHMgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09ICdzeW1ib2wnO1xuXG52YXIgaXNQcmltaXRpdmUgPSByZXF1aXJlKCcuL2hlbHBlcnMvaXNQcmltaXRpdmUnKTtcbnZhciBpc0NhbGxhYmxlID0gcmVxdWlyZSgnaXMtY2FsbGFibGUnKTtcbnZhciBpc0RhdGUgPSByZXF1aXJlKCdpcy1kYXRlLW9iamVjdCcpO1xudmFyIGlzU3ltYm9sID0gcmVxdWlyZSgnaXMtc3ltYm9sJyk7XG5cbnZhciBvcmRpbmFyeVRvUHJpbWl0aXZlID0gZnVuY3Rpb24gT3JkaW5hcnlUb1ByaW1pdGl2ZShPLCBoaW50KSB7XG5cdGlmICh0eXBlb2YgTyA9PT0gJ3VuZGVmaW5lZCcgfHwgTyA9PT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIG1ldGhvZCBvbiAnICsgTyk7XG5cdH1cblx0aWYgKHR5cGVvZiBoaW50ICE9PSAnc3RyaW5nJyB8fCAoaGludCAhPT0gJ251bWJlcicgJiYgaGludCAhPT0gJ3N0cmluZycpKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignaGludCBtdXN0IGJlIFwic3RyaW5nXCIgb3IgXCJudW1iZXJcIicpO1xuXHR9XG5cdHZhciBtZXRob2ROYW1lcyA9IGhpbnQgPT09ICdzdHJpbmcnID8gWyd0b1N0cmluZycsICd2YWx1ZU9mJ10gOiBbJ3ZhbHVlT2YnLCAndG9TdHJpbmcnXTtcblx0dmFyIG1ldGhvZCwgcmVzdWx0LCBpO1xuXHRmb3IgKGkgPSAwOyBpIDwgbWV0aG9kTmFtZXMubGVuZ3RoOyArK2kpIHtcblx0XHRtZXRob2QgPSBPW21ldGhvZE5hbWVzW2ldXTtcblx0XHRpZiAoaXNDYWxsYWJsZShtZXRob2QpKSB7XG5cdFx0XHRyZXN1bHQgPSBtZXRob2QuY2FsbChPKTtcblx0XHRcdGlmIChpc1ByaW1pdGl2ZShyZXN1bHQpKSB7XG5cdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHRocm93IG5ldyBUeXBlRXJyb3IoJ05vIGRlZmF1bHQgdmFsdWUnKTtcbn07XG5cbnZhciBHZXRNZXRob2QgPSBmdW5jdGlvbiBHZXRNZXRob2QoTywgUCkge1xuXHR2YXIgZnVuYyA9IE9bUF07XG5cdGlmIChmdW5jICE9PSBudWxsICYmIHR5cGVvZiBmdW5jICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGlmICghaXNDYWxsYWJsZShmdW5jKSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihmdW5jICsgJyByZXR1cm5lZCBmb3IgcHJvcGVydHkgJyArIFAgKyAnIG9mIG9iamVjdCAnICsgTyArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZ1bmM7XG5cdH1cbn07XG5cbi8vIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b3ByaW1pdGl2ZVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBUb1ByaW1pdGl2ZShpbnB1dCwgUHJlZmVycmVkVHlwZSkge1xuXHRpZiAoaXNQcmltaXRpdmUoaW5wdXQpKSB7XG5cdFx0cmV0dXJuIGlucHV0O1xuXHR9XG5cdHZhciBoaW50ID0gJ2RlZmF1bHQnO1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcblx0XHRpZiAoUHJlZmVycmVkVHlwZSA9PT0gU3RyaW5nKSB7XG5cdFx0XHRoaW50ID0gJ3N0cmluZyc7XG5cdFx0fSBlbHNlIGlmIChQcmVmZXJyZWRUeXBlID09PSBOdW1iZXIpIHtcblx0XHRcdGhpbnQgPSAnbnVtYmVyJztcblx0XHR9XG5cdH1cblxuXHR2YXIgZXhvdGljVG9QcmltO1xuXHRpZiAoaGFzU3ltYm9scykge1xuXHRcdGlmIChTeW1ib2wudG9QcmltaXRpdmUpIHtcblx0XHRcdGV4b3RpY1RvUHJpbSA9IEdldE1ldGhvZChpbnB1dCwgU3ltYm9sLnRvUHJpbWl0aXZlKTtcblx0XHR9IGVsc2UgaWYgKGlzU3ltYm9sKGlucHV0KSkge1xuXHRcdFx0ZXhvdGljVG9QcmltID0gU3ltYm9sLnByb3RvdHlwZS52YWx1ZU9mO1xuXHRcdH1cblx0fVxuXHRpZiAodHlwZW9mIGV4b3RpY1RvUHJpbSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHR2YXIgcmVzdWx0ID0gZXhvdGljVG9QcmltLmNhbGwoaW5wdXQsIGhpbnQpO1xuXHRcdGlmIChpc1ByaW1pdGl2ZShyZXN1bHQpKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH1cblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCd1bmFibGUgdG8gY29udmVydCBleG90aWMgb2JqZWN0IHRvIHByaW1pdGl2ZScpO1xuXHR9XG5cdGlmIChoaW50ID09PSAnZGVmYXVsdCcgJiYgKGlzRGF0ZShpbnB1dCkgfHwgaXNTeW1ib2woaW5wdXQpKSkge1xuXHRcdGhpbnQgPSAnc3RyaW5nJztcblx0fVxuXHRyZXR1cm4gb3JkaW5hcnlUb1ByaW1pdGl2ZShpbnB1dCwgaGludCA9PT0gJ2RlZmF1bHQnID8gJ251bWJlcicgOiBoaW50KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgaGFzU3ltYm9scyA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIFN5bWJvbCgpID09PSAnc3ltYm9sJztcblxuaWYgKGhhc1N5bWJvbHMpIHtcblx0dmFyIHN5bVRvU3RyID0gU3ltYm9sLnByb3RvdHlwZS50b1N0cmluZztcblx0dmFyIHN5bVN0cmluZ1JlZ2V4ID0gL15TeW1ib2xcXCguKlxcKSQvO1xuXHR2YXIgaXNTeW1ib2xPYmplY3QgPSBmdW5jdGlvbiBpc1N5bWJvbE9iamVjdCh2YWx1ZSkge1xuXHRcdGlmICh0eXBlb2YgdmFsdWUudmFsdWVPZigpICE9PSAnc3ltYm9sJykgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRyZXR1cm4gc3ltU3RyaW5nUmVnZXgudGVzdChzeW1Ub1N0ci5jYWxsKHZhbHVlKSk7XG5cdH07XG5cdG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNTeW1ib2wodmFsdWUpIHtcblx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnc3ltYm9sJykgeyByZXR1cm4gdHJ1ZTsgfVxuXHRcdGlmICh0b1N0ci5jYWxsKHZhbHVlKSAhPT0gJ1tvYmplY3QgU3ltYm9sXScpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBpc1N5bWJvbE9iamVjdCh2YWx1ZSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fTtcbn0gZWxzZSB7XG5cdG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNTeW1ib2wodmFsdWUpIHtcblx0XHQvLyB0aGlzIGVudmlyb25tZW50IGRvZXMgbm90IHN1cHBvcnQgU3ltYm9scy5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXREYXkgPSBEYXRlLnByb3RvdHlwZS5nZXREYXk7XG52YXIgdHJ5RGF0ZU9iamVjdCA9IGZ1bmN0aW9uIHRyeURhdGVPYmplY3QodmFsdWUpIHtcblx0dHJ5IHtcblx0XHRnZXREYXkuY2FsbCh2YWx1ZSk7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn07XG5cbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgZGF0ZUNsYXNzID0gJ1tvYmplY3QgRGF0ZV0nO1xudmFyIGhhc1RvU3RyaW5nVGFnID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLnRvU3RyaW5nVGFnID09PSAnc3ltYm9sJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0RhdGVPYmplY3QodmFsdWUpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgfHwgdmFsdWUgPT09IG51bGwpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdHJldHVybiBoYXNUb1N0cmluZ1RhZyA/IHRyeURhdGVPYmplY3QodmFsdWUpIDogdG9TdHIuY2FsbCh2YWx1ZSkgPT09IGRhdGVDbGFzcztcbn07XG4iLCJ2YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCBzb3VyY2UpIHtcblx0Zm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuXHRcdGlmIChoYXMuY2FsbChzb3VyY2UsIGtleSkpIHtcblx0XHRcdHRhcmdldFtrZXldID0gc291cmNlW2tleV07XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0YXJnZXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJGlzTmFOID0gcmVxdWlyZSgnLi9oZWxwZXJzL2lzTmFOJyk7XG52YXIgJGlzRmluaXRlID0gcmVxdWlyZSgnLi9oZWxwZXJzL2lzRmluaXRlJyk7XG5cbnZhciBzaWduID0gcmVxdWlyZSgnLi9oZWxwZXJzL3NpZ24nKTtcbnZhciBtb2QgPSByZXF1aXJlKCcuL2hlbHBlcnMvbW9kJyk7XG5cbnZhciBJc0NhbGxhYmxlID0gcmVxdWlyZSgnaXMtY2FsbGFibGUnKTtcbnZhciB0b1ByaW1pdGl2ZSA9IHJlcXVpcmUoJ2VzLXRvLXByaW1pdGl2ZS9lczUnKTtcblxuLy8gaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OVxudmFyIEVTNSA9IHtcblx0VG9QcmltaXRpdmU6IHRvUHJpbWl0aXZlLFxuXG5cdFRvQm9vbGVhbjogZnVuY3Rpb24gVG9Cb29sZWFuKHZhbHVlKSB7XG5cdFx0cmV0dXJuIEJvb2xlYW4odmFsdWUpO1xuXHR9LFxuXHRUb051bWJlcjogZnVuY3Rpb24gVG9OdW1iZXIodmFsdWUpIHtcblx0XHRyZXR1cm4gTnVtYmVyKHZhbHVlKTtcblx0fSxcblx0VG9JbnRlZ2VyOiBmdW5jdGlvbiBUb0ludGVnZXIodmFsdWUpIHtcblx0XHR2YXIgbnVtYmVyID0gdGhpcy5Ub051bWJlcih2YWx1ZSk7XG5cdFx0aWYgKCRpc05hTihudW1iZXIpKSB7IHJldHVybiAwOyB9XG5cdFx0aWYgKG51bWJlciA9PT0gMCB8fCAhJGlzRmluaXRlKG51bWJlcikpIHsgcmV0dXJuIG51bWJlcjsgfVxuXHRcdHJldHVybiBzaWduKG51bWJlcikgKiBNYXRoLmZsb29yKE1hdGguYWJzKG51bWJlcikpO1xuXHR9LFxuXHRUb0ludDMyOiBmdW5jdGlvbiBUb0ludDMyKHgpIHtcblx0XHRyZXR1cm4gdGhpcy5Ub051bWJlcih4KSA+PiAwO1xuXHR9LFxuXHRUb1VpbnQzMjogZnVuY3Rpb24gVG9VaW50MzIoeCkge1xuXHRcdHJldHVybiB0aGlzLlRvTnVtYmVyKHgpID4+PiAwO1xuXHR9LFxuXHRUb1VpbnQxNjogZnVuY3Rpb24gVG9VaW50MTYodmFsdWUpIHtcblx0XHR2YXIgbnVtYmVyID0gdGhpcy5Ub051bWJlcih2YWx1ZSk7XG5cdFx0aWYgKCRpc05hTihudW1iZXIpIHx8IG51bWJlciA9PT0gMCB8fCAhJGlzRmluaXRlKG51bWJlcikpIHsgcmV0dXJuIDA7IH1cblx0XHR2YXIgcG9zSW50ID0gc2lnbihudW1iZXIpICogTWF0aC5mbG9vcihNYXRoLmFicyhudW1iZXIpKTtcblx0XHRyZXR1cm4gbW9kKHBvc0ludCwgMHgxMDAwMCk7XG5cdH0sXG5cdFRvU3RyaW5nOiBmdW5jdGlvbiBUb1N0cmluZyh2YWx1ZSkge1xuXHRcdHJldHVybiBTdHJpbmcodmFsdWUpO1xuXHR9LFxuXHRUb09iamVjdDogZnVuY3Rpb24gVG9PYmplY3QodmFsdWUpIHtcblx0XHR0aGlzLkNoZWNrT2JqZWN0Q29lcmNpYmxlKHZhbHVlKTtcblx0XHRyZXR1cm4gT2JqZWN0KHZhbHVlKTtcblx0fSxcblx0Q2hlY2tPYmplY3RDb2VyY2libGU6IGZ1bmN0aW9uIENoZWNrT2JqZWN0Q29lcmNpYmxlKHZhbHVlLCBvcHRNZXNzYWdlKSB7XG5cdFx0LyoganNoaW50IGVxbnVsbDp0cnVlICovXG5cdFx0aWYgKHZhbHVlID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3Iob3B0TWVzc2FnZSB8fCAnQ2Fubm90IGNhbGwgbWV0aG9kIG9uICcgKyB2YWx1ZSk7XG5cdFx0fVxuXHRcdHJldHVybiB2YWx1ZTtcblx0fSxcblx0SXNDYWxsYWJsZTogSXNDYWxsYWJsZSxcblx0U2FtZVZhbHVlOiBmdW5jdGlvbiBTYW1lVmFsdWUoeCwgeSkge1xuXHRcdGlmICh4ID09PSB5KSB7IC8vIDAgPT09IC0wLCBidXQgdGhleSBhcmUgbm90IGlkZW50aWNhbC5cblx0XHRcdGlmICh4ID09PSAwKSB7IHJldHVybiAxIC8geCA9PT0gMSAvIHk7IH1cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gJGlzTmFOKHgpICYmICRpc05hTih5KTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFUzU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnZhciBpc1ByaW1pdGl2ZSA9IHJlcXVpcmUoJy4vaGVscGVycy9pc1ByaW1pdGl2ZScpO1xuXG52YXIgaXNDYWxsYWJsZSA9IHJlcXVpcmUoJ2lzLWNhbGxhYmxlJyk7XG5cbi8vIGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDguMTJcbnZhciBFUzVpbnRlcm5hbFNsb3RzID0ge1xuXHQnW1tEZWZhdWx0VmFsdWVdXSc6IGZ1bmN0aW9uIChPLCBoaW50KSB7XG5cdFx0dmFyIGFjdHVhbEhpbnQgPSBoaW50IHx8ICh0b1N0ci5jYWxsKE8pID09PSAnW29iamVjdCBEYXRlXScgPyBTdHJpbmcgOiBOdW1iZXIpO1xuXG5cdFx0aWYgKGFjdHVhbEhpbnQgPT09IFN0cmluZyB8fCBhY3R1YWxIaW50ID09PSBOdW1iZXIpIHtcblx0XHRcdHZhciBtZXRob2RzID0gYWN0dWFsSGludCA9PT0gU3RyaW5nID8gWyd0b1N0cmluZycsICd2YWx1ZU9mJ10gOiBbJ3ZhbHVlT2YnLCAndG9TdHJpbmcnXTtcblx0XHRcdHZhciB2YWx1ZSwgaTtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBtZXRob2RzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGlmIChpc0NhbGxhYmxlKE9bbWV0aG9kc1tpXV0pKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSBPW21ldGhvZHNbaV1dKCk7XG5cdFx0XHRcdFx0aWYgKGlzUHJpbWl0aXZlKHZhbHVlKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignTm8gZGVmYXVsdCB2YWx1ZScpO1xuXHRcdH1cblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdpbnZhbGlkIFtbRGVmYXVsdFZhbHVlXV0gaGludCBzdXBwbGllZCcpO1xuXHR9XG59O1xuXG4vLyBodHRwczovL2VzNS5naXRodWIuaW8vI3g5XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFRvUHJpbWl0aXZlKGlucHV0LCBQcmVmZXJyZWRUeXBlKSB7XG5cdGlmIChpc1ByaW1pdGl2ZShpbnB1dCkpIHtcblx0XHRyZXR1cm4gaW5wdXQ7XG5cdH1cblx0cmV0dXJuIEVTNWludGVybmFsU2xvdHNbJ1tbRGVmYXVsdFZhbHVlXV0nXShpbnB1dCwgUHJlZmVycmVkVHlwZSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZm5Ub1N0ciA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxudmFyIGNvbnN0cnVjdG9yUmVnZXggPSAvXlxccypjbGFzcyAvO1xudmFyIGlzRVM2Q2xhc3NGbiA9IGZ1bmN0aW9uIGlzRVM2Q2xhc3NGbih2YWx1ZSkge1xuXHR0cnkge1xuXHRcdHZhciBmblN0ciA9IGZuVG9TdHIuY2FsbCh2YWx1ZSk7XG5cdFx0dmFyIHNpbmdsZVN0cmlwcGVkID0gZm5TdHIucmVwbGFjZSgvXFwvXFwvLipcXG4vZywgJycpO1xuXHRcdHZhciBtdWx0aVN0cmlwcGVkID0gc2luZ2xlU3RyaXBwZWQucmVwbGFjZSgvXFwvXFwqWy5cXHNcXFNdKlxcKlxcLy9nLCAnJyk7XG5cdFx0dmFyIHNwYWNlU3RyaXBwZWQgPSBtdWx0aVN0cmlwcGVkLnJlcGxhY2UoL1xcbi9tZywgJyAnKS5yZXBsYWNlKC8gezJ9L2csICcgJyk7XG5cdFx0cmV0dXJuIGNvbnN0cnVjdG9yUmVnZXgudGVzdChzcGFjZVN0cmlwcGVkKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJldHVybiBmYWxzZTsgLy8gbm90IGEgZnVuY3Rpb25cblx0fVxufTtcblxudmFyIHRyeUZ1bmN0aW9uT2JqZWN0ID0gZnVuY3Rpb24gdHJ5RnVuY3Rpb25PYmplY3QodmFsdWUpIHtcblx0dHJ5IHtcblx0XHRpZiAoaXNFUzZDbGFzc0ZuKHZhbHVlKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRmblRvU3RyLmNhbGwodmFsdWUpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59O1xudmFyIHRvU3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBmbkNsYXNzID0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbnZhciBnZW5DbGFzcyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG52YXIgaGFzVG9TdHJpbmdUYWcgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wudG9TdHJpbmdUYWcgPT09ICdzeW1ib2wnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQ2FsbGFibGUodmFsdWUpIHtcblx0aWYgKCF2YWx1ZSkgeyByZXR1cm4gZmFsc2U7IH1cblx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRpZiAoaGFzVG9TdHJpbmdUYWcpIHsgcmV0dXJuIHRyeUZ1bmN0aW9uT2JqZWN0KHZhbHVlKTsgfVxuXHRpZiAoaXNFUzZDbGFzc0ZuKHZhbHVlKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0dmFyIHN0ckNsYXNzID0gdG9TdHIuY2FsbCh2YWx1ZSk7XG5cdHJldHVybiBzdHJDbGFzcyA9PT0gZm5DbGFzcyB8fCBzdHJDbGFzcyA9PT0gZ2VuQ2xhc3M7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1ByaW1pdGl2ZSh2YWx1ZSkge1xuXHRyZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNpZ24obnVtYmVyKSB7XG5cdHJldHVybiBudW1iZXIgPj0gMCA/IDEgOiAtMTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1vZChudW1iZXIsIG1vZHVsbykge1xuXHR2YXIgcmVtYWluID0gbnVtYmVyICUgbW9kdWxvO1xuXHRyZXR1cm4gTWF0aC5mbG9vcihyZW1haW4gPj0gMCA/IHJlbWFpbiA6IHJlbWFpbiArIG1vZHVsbyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBOdW1iZXIuaXNOYU4gfHwgZnVuY3Rpb24gaXNOYU4oYSkge1xuXHRyZXR1cm4gYSAhPT0gYTtcbn07XG4iLCJ2YXIgJGlzTmFOID0gTnVtYmVyLmlzTmFOIHx8IGZ1bmN0aW9uIChhKSB7IHJldHVybiBhICE9PSBhOyB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE51bWJlci5pc0Zpbml0ZSB8fCBmdW5jdGlvbiAoeCkgeyByZXR1cm4gdHlwZW9mIHggPT09ICdudW1iZXInICYmICEkaXNOYU4oeCkgJiYgeCAhPT0gSW5maW5pdHkgJiYgeCAhPT0gLUluZmluaXR5OyB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIga2V5cyA9IHJlcXVpcmUoJ29iamVjdC1rZXlzJyk7XG52YXIgZm9yZWFjaCA9IHJlcXVpcmUoJ2ZvcmVhY2gnKTtcbnZhciBoYXNTeW1ib2xzID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sKCkgPT09ICdzeW1ib2wnO1xuXG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG52YXIgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uIChmbikge1xuXHRyZXR1cm4gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nICYmIHRvU3RyLmNhbGwoZm4pID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufTtcblxudmFyIGFyZVByb3BlcnR5RGVzY3JpcHRvcnNTdXBwb3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBvYmogPSB7fTtcblx0dHJ5IHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCAneCcsIHsgZW51bWVyYWJsZTogZmFsc2UsIHZhbHVlOiBvYmogfSk7XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzLCBuby1yZXN0cmljdGVkLXN5bnRheCAqL1xuICAgICAgICBmb3IgKHZhciBfIGluIG9iaikgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtdmFycywgbm8tcmVzdHJpY3RlZC1zeW50YXggKi9cblx0XHRyZXR1cm4gb2JqLnggPT09IG9iajtcblx0fSBjYXRjaCAoZSkgeyAvKiB0aGlzIGlzIElFIDguICovXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59O1xudmFyIHN1cHBvcnRzRGVzY3JpcHRvcnMgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkgJiYgYXJlUHJvcGVydHlEZXNjcmlwdG9yc1N1cHBvcnRlZCgpO1xuXG52YXIgZGVmaW5lUHJvcGVydHkgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCB2YWx1ZSwgcHJlZGljYXRlKSB7XG5cdGlmIChuYW1lIGluIG9iamVjdCAmJiAoIWlzRnVuY3Rpb24ocHJlZGljYXRlKSB8fCAhcHJlZGljYXRlKCkpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmIChzdXBwb3J0c0Rlc2NyaXB0b3JzKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgbmFtZSwge1xuXHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0XHR3cml0YWJsZTogdHJ1ZVxuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdG9iamVjdFtuYW1lXSA9IHZhbHVlO1xuXHR9XG59O1xuXG52YXIgZGVmaW5lUHJvcGVydGllcyA9IGZ1bmN0aW9uIChvYmplY3QsIG1hcCkge1xuXHR2YXIgcHJlZGljYXRlcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXJndW1lbnRzWzJdIDoge307XG5cdHZhciBwcm9wcyA9IGtleXMobWFwKTtcblx0aWYgKGhhc1N5bWJvbHMpIHtcblx0XHRwcm9wcyA9IHByb3BzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG1hcCkpO1xuXHR9XG5cdGZvcmVhY2gocHJvcHMsIGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0ZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCBtYXBbbmFtZV0sIHByZWRpY2F0ZXNbbmFtZV0pO1xuXHR9KTtcbn07XG5cbmRlZmluZVByb3BlcnRpZXMuc3VwcG9ydHNEZXNjcmlwdG9ycyA9ICEhc3VwcG9ydHNEZXNjcmlwdG9ycztcblxubW9kdWxlLmV4cG9ydHMgPSBkZWZpbmVQcm9wZXJ0aWVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBtb2RpZmllZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9lcy1zaGltcy9lczUtc2hpbVxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGlzQXJncyA9IHJlcXVpcmUoJy4vaXNBcmd1bWVudHMnKTtcbnZhciBoYXNEb250RW51bUJ1ZyA9ICEoeyB0b1N0cmluZzogbnVsbCB9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKTtcbnZhciBoYXNQcm90b0VudW1CdWcgPSBmdW5jdGlvbiAoKSB7fS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgncHJvdG90eXBlJyk7XG52YXIgZG9udEVudW1zID0gW1xuXHQndG9TdHJpbmcnLFxuXHQndG9Mb2NhbGVTdHJpbmcnLFxuXHQndmFsdWVPZicsXG5cdCdoYXNPd25Qcm9wZXJ0eScsXG5cdCdpc1Byb3RvdHlwZU9mJyxcblx0J3Byb3BlcnR5SXNFbnVtZXJhYmxlJyxcblx0J2NvbnN0cnVjdG9yJ1xuXTtcbnZhciBlcXVhbHNDb25zdHJ1Y3RvclByb3RvdHlwZSA9IGZ1bmN0aW9uIChvKSB7XG5cdHZhciBjdG9yID0gby5jb25zdHJ1Y3Rvcjtcblx0cmV0dXJuIGN0b3IgJiYgY3Rvci5wcm90b3R5cGUgPT09IG87XG59O1xudmFyIGJsYWNrbGlzdGVkS2V5cyA9IHtcblx0JGNvbnNvbGU6IHRydWUsXG5cdCRmcmFtZTogdHJ1ZSxcblx0JGZyYW1lRWxlbWVudDogdHJ1ZSxcblx0JGZyYW1lczogdHJ1ZSxcblx0JHBhcmVudDogdHJ1ZSxcblx0JHNlbGY6IHRydWUsXG5cdCR3ZWJraXRJbmRleGVkREI6IHRydWUsXG5cdCR3ZWJraXRTdG9yYWdlSW5mbzogdHJ1ZSxcblx0JHdpbmRvdzogdHJ1ZVxufTtcbnZhciBoYXNBdXRvbWF0aW9uRXF1YWxpdHlCdWcgPSAoZnVuY3Rpb24gKCkge1xuXHQvKiBnbG9iYWwgd2luZG93ICovXG5cdGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgeyByZXR1cm4gZmFsc2U7IH1cblx0Zm9yICh2YXIgayBpbiB3aW5kb3cpIHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCFibGFja2xpc3RlZEtleXNbJyQnICsga10gJiYgaGFzLmNhbGwod2luZG93LCBrKSAmJiB3aW5kb3dba10gIT09IG51bGwgJiYgdHlwZW9mIHdpbmRvd1trXSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRlcXVhbHNDb25zdHJ1Y3RvclByb3RvdHlwZSh3aW5kb3dba10pO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufSgpKTtcbnZhciBlcXVhbHNDb25zdHJ1Y3RvclByb3RvdHlwZUlmTm90QnVnZ3kgPSBmdW5jdGlvbiAobykge1xuXHQvKiBnbG9iYWwgd2luZG93ICovXG5cdGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCAhaGFzQXV0b21hdGlvbkVxdWFsaXR5QnVnKSB7XG5cdFx0cmV0dXJuIGVxdWFsc0NvbnN0cnVjdG9yUHJvdG90eXBlKG8pO1xuXHR9XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGVxdWFsc0NvbnN0cnVjdG9yUHJvdG90eXBlKG8pO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59O1xuXG52YXIga2V5c1NoaW0gPSBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuXHR2YXIgaXNPYmplY3QgPSBvYmplY3QgIT09IG51bGwgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCc7XG5cdHZhciBpc0Z1bmN0aW9uID0gdG9TdHIuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXHR2YXIgaXNBcmd1bWVudHMgPSBpc0FyZ3Mob2JqZWN0KTtcblx0dmFyIGlzU3RyaW5nID0gaXNPYmplY3QgJiYgdG9TdHIuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBTdHJpbmddJztcblx0dmFyIHRoZUtleXMgPSBbXTtcblxuXHRpZiAoIWlzT2JqZWN0ICYmICFpc0Z1bmN0aW9uICYmICFpc0FyZ3VtZW50cykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5rZXlzIGNhbGxlZCBvbiBhIG5vbi1vYmplY3QnKTtcblx0fVxuXG5cdHZhciBza2lwUHJvdG8gPSBoYXNQcm90b0VudW1CdWcgJiYgaXNGdW5jdGlvbjtcblx0aWYgKGlzU3RyaW5nICYmIG9iamVjdC5sZW5ndGggPiAwICYmICFoYXMuY2FsbChvYmplY3QsIDApKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvYmplY3QubGVuZ3RoOyArK2kpIHtcblx0XHRcdHRoZUtleXMucHVzaChTdHJpbmcoaSkpO1xuXHRcdH1cblx0fVxuXG5cdGlmIChpc0FyZ3VtZW50cyAmJiBvYmplY3QubGVuZ3RoID4gMCkge1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgb2JqZWN0Lmxlbmd0aDsgKytqKSB7XG5cdFx0XHR0aGVLZXlzLnB1c2goU3RyaW5nKGopKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm9yICh2YXIgbmFtZSBpbiBvYmplY3QpIHtcblx0XHRcdGlmICghKHNraXBQcm90byAmJiBuYW1lID09PSAncHJvdG90eXBlJykgJiYgaGFzLmNhbGwob2JqZWN0LCBuYW1lKSkge1xuXHRcdFx0XHR0aGVLZXlzLnB1c2goU3RyaW5nKG5hbWUpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAoaGFzRG9udEVudW1CdWcpIHtcblx0XHR2YXIgc2tpcENvbnN0cnVjdG9yID0gZXF1YWxzQ29uc3RydWN0b3JQcm90b3R5cGVJZk5vdEJ1Z2d5KG9iamVjdCk7XG5cblx0XHRmb3IgKHZhciBrID0gMDsgayA8IGRvbnRFbnVtcy5sZW5ndGg7ICsraykge1xuXHRcdFx0aWYgKCEoc2tpcENvbnN0cnVjdG9yICYmIGRvbnRFbnVtc1trXSA9PT0gJ2NvbnN0cnVjdG9yJykgJiYgaGFzLmNhbGwob2JqZWN0LCBkb250RW51bXNba10pKSB7XG5cdFx0XHRcdHRoZUtleXMucHVzaChkb250RW51bXNba10pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gdGhlS2V5cztcbn07XG5cbmtleXNTaGltLnNoaW0gPSBmdW5jdGlvbiBzaGltT2JqZWN0S2V5cygpIHtcblx0aWYgKE9iamVjdC5rZXlzKSB7XG5cdFx0dmFyIGtleXNXb3Jrc1dpdGhBcmd1bWVudHMgPSAoZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gU2FmYXJpIDUuMCBidWdcblx0XHRcdHJldHVybiAoT2JqZWN0LmtleXMoYXJndW1lbnRzKSB8fCAnJykubGVuZ3RoID09PSAyO1xuXHRcdH0oMSwgMikpO1xuXHRcdGlmICgha2V5c1dvcmtzV2l0aEFyZ3VtZW50cykge1xuXHRcdFx0dmFyIG9yaWdpbmFsS2V5cyA9IE9iamVjdC5rZXlzO1xuXHRcdFx0T2JqZWN0LmtleXMgPSBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuXHRcdFx0XHRpZiAoaXNBcmdzKG9iamVjdCkpIHtcblx0XHRcdFx0XHRyZXR1cm4gb3JpZ2luYWxLZXlzKHNsaWNlLmNhbGwob2JqZWN0KSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9yaWdpbmFsS2V5cyhvYmplY3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRPYmplY3Qua2V5cyA9IGtleXNTaGltO1xuXHR9XG5cdHJldHVybiBPYmplY3Qua2V5cyB8fCBrZXlzU2hpbTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5c1NoaW07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcblx0dmFyIHN0ciA9IHRvU3RyLmNhbGwodmFsdWUpO1xuXHR2YXIgaXNBcmdzID0gc3RyID09PSAnW29iamVjdCBBcmd1bWVudHNdJztcblx0aWYgKCFpc0FyZ3MpIHtcblx0XHRpc0FyZ3MgPSBzdHIgIT09ICdbb2JqZWN0IEFycmF5XScgJiZcblx0XHRcdHZhbHVlICE9PSBudWxsICYmXG5cdFx0XHR0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG5cdFx0XHR0eXBlb2YgdmFsdWUubGVuZ3RoID09PSAnbnVtYmVyJyAmJlxuXHRcdFx0dmFsdWUubGVuZ3RoID49IDAgJiZcblx0XHRcdHRvU3RyLmNhbGwodmFsdWUuY2FsbGVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0fVxuXHRyZXR1cm4gaXNBcmdzO1xufTtcbiIsIlxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvckVhY2ggKG9iaiwgZm4sIGN0eCkge1xuICAgIGlmICh0b1N0cmluZy5jYWxsKGZuKSAhPT0gJ1tvYmplY3QgRnVuY3Rpb25dJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICB9XG4gICAgdmFyIGwgPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsID09PSArbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgZm4uY2FsbChjdHgsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrKSkge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY3R4LCBvYmpba10sIGssIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4iLCIndXNlIHN0cmljdCdcblxuY2xhc3MgQ29sbGVjdGlvbk1hcCBleHRlbmRzIE1hcCB7XG4gIC8qKlxuICAgKiBBIG1hcCB0aGF0IHJldHVybnMgbmV3IGNvbGxlY3Rpb25zIHdoZW4gZ2V0dGluZyBieSBhIG5vbi1leGlzdGluZyBrZXlcbiAgICogYW5kIHJlbW92ZXMgZW1wdHkgY29sbGVjdGlvbnMgZnJvbSBpdHNlbGZcbiAgICogQHBhcmFtICB7SXRlcmFibGV9IGl0ZXJhYmxlXG4gICAqIEBwYXJhbSAge1t0eXBlXX0gdmFsdWVJbml0Q3RvciBJbml0aWFsIHZhbHVlIGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSAge1t0eXBlXX0gdmFsdWVTaXplUHJvcCBQcm9wZXJ0eSBuYW1lIHVzZWQgdG8gY2hlY2sgZW1wdHkgdmFsdWVzXG4gICAqIEByZXR1cm4ge0NvbGxlY3Rpb25NYXB9XG4gICAqL1xuICBjb25zdHJ1Y3Rvcih2YWx1ZUluaXRDdG9yLCB2YWx1ZVNpemVQcm9wLCBpdGVyYWJsZSA9IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgdmFsdWVJbml0Q3RvciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCdNaXNzaW5nIGluaXRpYWwgdmFsdWUgY29uc3RydWN0b3InKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlU2l6ZVByb3AgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ01pc3NpbmcgdmFsdWUgc2l6ZSBwcm9wZXJ0eScpXG4gICAgfVxuICAgIHN1cGVyKGl0ZXJhYmxlKVxuICAgIE9iamVjdC5hc3NpZ24odGhpcywge3ZhbHVlSW5pdEN0b3IsIHZhbHVlU2l6ZVByb3B9KVxuICB9XG4gIGdldChrZXkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHN1cGVyLmdldChrZXkpXG4gICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgPyBuZXcgdGhpcy52YWx1ZUluaXRDdG9yKCkgOiB2YWx1ZVxuICB9XG4gIHNldChrZXksIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlW3RoaXMudmFsdWVTaXplUHJvcF0gPT09IDApIHtcbiAgICAgIHRoaXMuZGVsZXRlKGtleSlcbiAgICB9IGVsc2Uge1xuICAgICAgc3VwZXIuc2V0KGtleSwgdmFsdWUpXG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cbn1cblxuY2xhc3MgQXJyYXlNYXAgZXh0ZW5kcyBDb2xsZWN0aW9uTWFwIHtcbiAgY29uc3RydWN0b3IoaXRlcmFibGUgPSB1bmRlZmluZWQpIHtcbiAgICBzdXBlcihBcnJheSwgJ2xlbmd0aCcsIGl0ZXJhYmxlKVxuICB9XG59XG5cbmNsYXNzIE1hcE1hcCBleHRlbmRzIENvbGxlY3Rpb25NYXAge1xuICBjb25zdHJ1Y3RvcihpdGVyYWJsZSA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKE1hcCwgJ3NpemUnLCBpdGVyYWJsZSlcbiAgfVxufVxuXG5jbGFzcyBTZXRNYXAgZXh0ZW5kcyBDb2xsZWN0aW9uTWFwIHtcbiAgY29uc3RydWN0b3IoaXRlcmFibGUgPSB1bmRlZmluZWQpIHtcbiAgICBzdXBlcihTZXQsICdzaXplJywgaXRlcmFibGUpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7Q29sbGVjdGlvbk1hcCwgQXJyYXlNYXAsIE1hcE1hcCwgU2V0TWFwfVxuIl19

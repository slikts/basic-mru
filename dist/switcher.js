require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({46:[function(require,module,exports){
'use strict';

const switcher = require('./_switcher');

switcher((_, i) => i).then(({ dom, cycle }) => {
  document.body.appendChild(dom);

  chrome.extension.onMessage.addListener((key, _, respond) => {
    if (cycle[key]) {
      cycle[key]();
    } else if (key === 'close') {
      respond(+cycle.current().dataset.id);
    }
  });
});

},{"./_switcher":42}]},{},[46])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXHN3aXRjaGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxNQUFNLFdBQVcsUUFBUSxhQUFSLENBQWpCOztBQUVBLFNBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixLQUFVLENBQW5CLEVBQXNCLElBQXRCLENBQTJCLENBQUMsRUFBQyxHQUFELEVBQU0sS0FBTixFQUFELEtBQWtCO0FBQzNDLFdBQVMsSUFBVCxDQUFjLFdBQWQsQ0FBMEIsR0FBMUI7O0FBRUEsU0FBTyxTQUFQLENBQWlCLFNBQWpCLENBQTJCLFdBQTNCLENBQXVDLENBQUMsR0FBRCxFQUFNLENBQU4sRUFBUyxPQUFULEtBQXFCO0FBQzFELFFBQUksTUFBTSxHQUFOLENBQUosRUFBZ0I7QUFDZCxZQUFNLEdBQU47QUFDRCxLQUZELE1BR0ssSUFBSSxRQUFRLE9BQVosRUFBcUI7QUFDeEIsY0FBUSxDQUFDLE1BQU0sT0FBTixHQUFnQixPQUFoQixDQUF3QixFQUFqQztBQUNEO0FBQ0YsR0FQRDtBQVFELENBWEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3Qgc3dpdGNoZXIgPSByZXF1aXJlKCcuL19zd2l0Y2hlcicpXG5cbnN3aXRjaGVyKChfLCBpKSA9PiBpKS50aGVuKCh7ZG9tLCBjeWNsZX0pID0+IHtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb20pXG5cbiAgY2hyb21lLmV4dGVuc2lvbi5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKGtleSwgXywgcmVzcG9uZCkgPT4ge1xuICAgIGlmIChjeWNsZVtrZXldKSB7XG4gICAgICBjeWNsZVtrZXldKClcbiAgICB9XG4gICAgZWxzZSBpZiAoa2V5ID09PSAnY2xvc2UnKSB7XG4gICAgICByZXNwb25kKCtjeWNsZS5jdXJyZW50KCkuZGF0YXNldC5pZClcbiAgICB9XG4gIH0pXG59KVxuIl19

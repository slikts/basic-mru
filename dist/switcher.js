require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({46:[function(require,module,exports){
'use strict';

const switcher = require('./_switcher');

switcher(1).then(({ dom, cycle }) => {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXHN3aXRjaGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxNQUFNLFdBQVcsUUFBUSxhQUFSLENBQWpCOztBQUVBLFNBQVMsQ0FBVCxFQUFZLElBQVosQ0FBaUIsQ0FBQyxFQUFDLEdBQUQsRUFBTSxLQUFOLEVBQUQsS0FBa0I7QUFDakMsV0FBUyxJQUFULENBQWMsV0FBZCxDQUEwQixHQUExQjs7QUFFQSxTQUFPLFNBQVAsQ0FBaUIsU0FBakIsQ0FBMkIsV0FBM0IsQ0FBdUMsQ0FBQyxHQUFELEVBQU0sQ0FBTixFQUFTLE9BQVQsS0FBcUI7QUFDMUQsUUFBSSxNQUFNLEdBQU4sQ0FBSixFQUFnQjtBQUNkLFlBQU0sR0FBTjtBQUNELEtBRkQsTUFHSyxJQUFJLFFBQVEsT0FBWixFQUFxQjtBQUN4QixjQUFRLENBQUMsTUFBTSxPQUFOLEdBQWdCLE9BQWhCLENBQXdCLEVBQWpDO0FBQ0Q7QUFDRixHQVBEO0FBUUQsQ0FYRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBzd2l0Y2hlciA9IHJlcXVpcmUoJy4vX3N3aXRjaGVyJylcblxuc3dpdGNoZXIoMSkudGhlbigoe2RvbSwgY3ljbGV9KSA9PiB7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZG9tKVxuXG4gIGNocm9tZS5leHRlbnNpb24ub25NZXNzYWdlLmFkZExpc3RlbmVyKChrZXksIF8sIHJlc3BvbmQpID0+IHtcbiAgICBpZiAoY3ljbGVba2V5XSkge1xuICAgICAgY3ljbGVba2V5XSgpXG4gICAgfVxuICAgIGVsc2UgaWYgKGtleSA9PT0gJ2Nsb3NlJykge1xuICAgICAgcmVzcG9uZCgrY3ljbGUuY3VycmVudCgpLmRhdGFzZXQuaWQpXG4gICAgfVxuICB9KVxufSlcbiJdfQ==

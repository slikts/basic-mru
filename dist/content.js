require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({44:[function(require,module,exports){
'use strict';

// chrome = require('promiseproxy-chrome')(chrome)
const { log } = require('./util');

// if (window === top) {
// addEventListener('keyup', e => {
//   console.log(e.keyCode)
//   if (e.keyCode === 17)  {
//     chrome.runtime.sendMessage('mods_up')
//   }
// })

// addEventListener('blur', () => {
//   chrome.runtime.sendMessage('blur')
// })
//
// addEventListener('focus', () => {
//   chrome.runtime.sendMessage('focus')
// })
// } else {
// log('window === top', false, location.href)
// }

},{"./util":47}]},{},[44])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGNvbnRlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUNDQSxNQUFNLEVBQUMsR0FBRCxLQUFRLFFBQVEsUUFBUixDQUFkIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGNocm9tZSA9IHJlcXVpcmUoJ3Byb21pc2Vwcm94eS1jaHJvbWUnKShjaHJvbWUpXG5jb25zdCB7bG9nfSA9IHJlcXVpcmUoJy4vdXRpbCcpXG5cbi8vIGlmICh3aW5kb3cgPT09IHRvcCkge1xuLy8gYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBlID0+IHtcbi8vICAgY29uc29sZS5sb2coZS5rZXlDb2RlKVxuLy8gICBpZiAoZS5rZXlDb2RlID09PSAxNykgIHtcbi8vICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSgnbW9kc191cCcpXG4vLyAgIH1cbi8vIH0pXG5cbi8vIGFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAoKSA9PiB7XG4vLyAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKCdibHVyJylcbi8vIH0pXG4vL1xuLy8gYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoKSA9PiB7XG4vLyAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKCdmb2N1cycpXG4vLyB9KVxuLy8gfSBlbHNlIHtcbiAgLy8gbG9nKCd3aW5kb3cgPT09IHRvcCcsIGZhbHNlLCBsb2NhdGlvbi5ocmVmKVxuLy8gfVxuIl19

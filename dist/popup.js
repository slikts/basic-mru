require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({45:[function(require,module,exports){
'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const switcher = require('./_switcher');

const wrapper = document.querySelector('#wrapper');
switcher().then(({ dom }) => {
  wrapper.appendChild(dom);
});
const filter = document.querySelector('#filter');
filter.focus();
let prevValue = '';
const handle = (() => {
  var ref = _asyncToGenerator(function* () {
    const value = filter.value.trim().toLowerCase();
    if (value === prevValue) return;
    prevValue = value;
    const { dom } = yield switcher(function ({ title }) {
      return title.toLowerCase().includes(value);
    });
    Array.from(document.querySelectorAll('#switcher')).map(function (el) {
      return el.remove();
    });
    wrapper.appendChild(dom);
  });

  return function handle() {
    return ref.apply(this, arguments);
  };
})();
filter.addEventListener('search', handle);
filter.addEventListener('keyup', handle);

},{"./_switcher":42}]},{},[45])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXHBvcHVwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBLE1BQU0sV0FBVyxRQUFRLGFBQVIsQ0FBakI7O0FBRUEsTUFBTSxVQUFVLFNBQVMsYUFBVCxDQUF1QixVQUF2QixDQUFoQjtBQUNBLFdBQVcsSUFBWCxDQUFnQixDQUFDLEVBQUMsR0FBRCxFQUFELEtBQVc7QUFDekIsVUFBUSxXQUFSLENBQW9CLEdBQXBCO0FBQ0QsQ0FGRDtBQUdBLE1BQU0sU0FBUyxTQUFTLGFBQVQsQ0FBdUIsU0FBdkIsQ0FBZjtBQUNBLE9BQU8sS0FBUDtBQUNBLElBQUksWUFBWSxFQUFoQjtBQUNBLE1BQU07QUFBQSw4QkFBUyxhQUFZO0FBQ3pCLFVBQU0sUUFBUSxPQUFPLEtBQVAsQ0FBYSxJQUFiLEdBQW9CLFdBQXBCLEVBQWQ7QUFDQSxRQUFJLFVBQVUsU0FBZCxFQUF5QjtBQUN6QixnQkFBWSxLQUFaO0FBQ0EsVUFBTSxFQUFDLEdBQUQsS0FBUSxNQUFNLFNBQVMsVUFBQyxFQUFDLEtBQUQsRUFBRDtBQUFBLGFBQWEsTUFBTSxXQUFOLEdBQW9CLFFBQXBCLENBQTZCLEtBQTdCLENBQWI7QUFBQSxLQUFULENBQXBCO0FBQ0EsVUFBTSxJQUFOLENBQVcsU0FBUyxnQkFBVCxDQUEwQixXQUExQixDQUFYLEVBQW1ELEdBQW5ELENBQXVEO0FBQUEsYUFBTSxHQUFHLE1BQUgsRUFBTjtBQUFBLEtBQXZEO0FBQ0EsWUFBUSxXQUFSLENBQW9CLEdBQXBCO0FBQ0QsR0FQSzs7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFOO0FBUUEsT0FBTyxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxNQUFsQztBQUNBLE9BQU8sZ0JBQVAsQ0FBd0IsT0FBeEIsRUFBaUMsTUFBakMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3Qgc3dpdGNoZXIgPSByZXF1aXJlKCcuL19zd2l0Y2hlcicpXG5cbmNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd3JhcHBlcicpXG5zd2l0Y2hlcigpLnRoZW4oKHtkb219KSA9PiB7XG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQoZG9tKVxufSlcbmNvbnN0IGZpbHRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmaWx0ZXInKVxuZmlsdGVyLmZvY3VzKClcbmxldCBwcmV2VmFsdWUgPSAnJ1xuY29uc3QgaGFuZGxlID0gYXN5bmMgKCkgPT4ge1xuICBjb25zdCB2YWx1ZSA9IGZpbHRlci52YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKVxuICBpZiAodmFsdWUgPT09IHByZXZWYWx1ZSkgcmV0dXJuXG4gIHByZXZWYWx1ZSA9IHZhbHVlXG4gIGNvbnN0IHtkb219ID0gYXdhaXQgc3dpdGNoZXIoKHt0aXRsZX0pID0+IHRpdGxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModmFsdWUpKVxuICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNzd2l0Y2hlcicpKS5tYXAoZWwgPT4gZWwucmVtb3ZlKCkpXG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQoZG9tKVxufVxuZmlsdGVyLmFkZEV2ZW50TGlzdGVuZXIoJ3NlYXJjaCcsIGhhbmRsZSlcbmZpbHRlci5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGhhbmRsZSlcbiJdfQ==

const debug = true

module.exports = {
  log: debug ? (...args) => { console.log('mru', ...args); return args[0] } : () => {},
}

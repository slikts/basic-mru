const switcher = require('./_switcher')

switcher(1).then(({dom, cycle}) => {
  document.body.appendChild(dom)

  chrome.extension.onMessage.addListener((key, _, respond) => {
    if (cycle[key]) {
      cycle[key]()
    }
    else if (key === 'close') {
      respond(+cycle.current().dataset.id)
    }
  })
})

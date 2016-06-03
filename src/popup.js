const switcher = require('./_switcher')

switcher().then(({dom}) => {
  document.body.appendChild(dom)
  const popup = document.querySelector('#filter')
  popup.focus()
})

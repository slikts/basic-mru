const switcher = require('./_switcher')

const wrapper = document.querySelector('#wrapper')
switcher().then(({dom}) => {
  wrapper.appendChild(dom)
})
const filter = document.querySelector('#filter')
filter.focus()
let prevValue = ''
const handle = async () => {
  const value = filter.value.trim().toLowerCase()
  if (value === prevValue) return
  prevValue = value
  const {dom} = await switcher(({title}) => title.toLowerCase().includes(value))
  Array.from(document.querySelectorAll('#switcher')).map(el => el.remove())
  wrapper.appendChild(dom)
}
filter.addEventListener('search', handle)
filter.addEventListener('keyup', handle)

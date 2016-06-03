const {Circulator} = require('circulator')

const cn = 'active'
class TabCycle extends Circulator {
  constructor(it) {
    super(it)
    this.current()
    const hash = location.hash.slice(1)
    if (this[hash]) {
      this[hash]()
      location.hash = ''
      history.pushState('', document.title, location.href.split('#')[0])
    }
  }
  next() {
    this.current().classList.remove(cn)
    super.next().classList.add(cn)
  }
  prev() {
    this.current().classList.remove(cn)
    super.prev().classList.add(cn)
  }
}

chrome = require('promiseproxy-chrome')(chrome)

const placeholder = (id, key) => `<span class="placeholder" data-id="${id}" data-key="${key}"></span>`
const item = ({id, favIconUrl}) => `<li data-id="${id}" class="tab">
  <h1 class="title"><img class="favicon" src="${favIconUrl || ''}" width="16" height="16">${placeholder(id, 'title')}</h1>
  <p class="url">${placeholder(id, 'url')}</p>
</li>`
const list = tabs => `<ol id="switcher">${tabs.map(item).join('')}</ol>`

async function init(skip = 0) {
  const bg = await chrome.runtime.getBackgroundPage()
  const tabIds = bg.windows.get((await chrome.windows.getCurrent()).id)
  const tabs = (await Promise.all([...tabIds].map(id => chrome.tabs.get(id)))).slice(skip)
  const dom = document.createRange().createContextualFragment(list(tabs))
  const cycle = new TabCycle(dom.querySelectorAll('.tab'))
  const tabMap = new Map(tabs.map(tab => [String(tab.id), tab]))
  Array.from(dom.querySelectorAll('.placeholder')).forEach(el => {
    const {id, key} = el.dataset
    el.textContent = tabMap.get(id)[key]
  })
  return {dom, cycle}
}

addEventListener('keyup', e => {
  if (e.keyCode === 18)  {
    chrome.runtime.sendMessage('switcher_mods_up')
  }
})

module.exports = init

// ==UserScript==
// @name        GitHub to OpenAI
// @namespace   Violentmonkey Scripts
// @match       https://github.com/*
// @grant       none
// @version     1.1
// @author      rigwild (https://github.com/rigwild/github-to-openai)
// @description Copy a GitHub conversation and ask OpenAI ChatGPT what to answer
// @homepageURL https://github.com/rigwild/github-to-openai
// @supportURL  https://github.com/rigwild/github-to-openai/issues
// @updateURL   https://raw.githubusercontent.com/rigwild/github-to-openai/main/github-to-openai.js
// @downloadURL https://raw.githubusercontent.com/rigwild/github-to-openai/main/github-to-openai.js
// @grant       GM_xmlhttpRequest
// @grant       GM_setClipboard
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==

// @ts-check

/**
 * This key will by asked to you the first time you click on the trigger link.
 * sk-...`
 * @see https://beta.openai.com/account/api-keys
 */
let OPEN_AI_API_KEY = ''

const triggerElement = addTriggerLink()

triggerElement.addEventListener('click', async e => {
  if (e.shiftKey) {
    await removeApiKey()
    return
  }

  if (!OPEN_AI_API_KEY) {
    const hasRegistered = await registerApiKey()
    if (!hasRegistered) return
  }

  await getSuggestion()
})

// We check the current url periodically as GitHub is doing client-side routing
setInterval(
  () =>
    setVisible(
      triggerElement,
      ['/pull/', '/issues/', '/discussions/'].some(x => window.location.href.includes(x))
    ),
  100
)

async function registerApiKey() {
  const storedKey = await GM_getValue('openai-api-key')
  if (storedKey) {
    OPEN_AI_API_KEY = storedKey
    return true
  }

  const key = prompt('Enter your OpenAI API key') || ''
  if (key) {
    OPEN_AI_API_KEY = key
    await GM_setValue('openai-api-key', OPEN_AI_API_KEY)
    return true
  }

  alert('No OpenAI API key entered, click again if you want to retry.')
  return false
}

async function removeApiKey() {
  OPEN_AI_API_KEY = ''
  await GM_deleteValue('openai-api-key')
  alert('OpenAI API key deleted from storage.')
}

async function getSuggestion() {
  const conversation = getConversation()

  setTriggerElementState('idle')
  try {
    // GM_notification('Asking OpenAI GPT-3 what to answer...', 'GitHub to OpenAI')
    setTriggerElementState('loading')
    // const openAiResponse = await askToGpt3(prompt)
    // GM_setClipboard(openAiResponse.choices[0].text)
    const openAiResponse = await askToChatGPT(conversation)
    console.log('[GitHub to OpenAI]', { ...openAiResponse, conversation })
    if ('error' in openAiResponse) throw new Error(openAiResponse.error.message)
    GM_setClipboard(openAiResponse.choices[0].message.content)
    setTriggerElementState('success')
    // GM_notification('Suggested answer copied to clipboard!', 'GitHub to OpenAI')
  } catch (err) {
    // GM_notification('Error: ' + e.message, 'GitHub to OpenAI')
    console.error(err)
    setTriggerElementState('error', err.message)
  } finally {
    setTimeout(() => setTriggerElementState('idle'), 7500)
  }
}

function getGitHubUsername() {
  return document.querySelector('.Header-link img').alt.slice(1)
}

function getConversation() {
  return [...document.querySelectorAll('.timeline-comment')]
    .slice(0, -1)
    .map(x => {
      const user = x.querySelector('.author')?.innerText.trim() || ''
      const date = x.querySelector('relative-time')?.title.trim() || ''
      const text = x.querySelector('.comment-body')?.innerText.trim() || ''
      return `@${user} on [${date}]: """\n${text}\n"""`
    })
    .map(x => x.trim())
    .join('\n\n==========\n\n')
}

function addTriggerLink() {
  const div = document.createElement('div')

  div.style.position = 'fixed'
  div.style.zIndex = '999999'
  div.style.fontSize = '12px'
  div.style.bottom = '15px'
  div.style.right = '20px'
  div.id = 'github-to-openai'
  document.body.prepend(div)

  const a = document.createElement('a')
  // a.href = `#`
  a.innerText = '👉 Ask ChatGPT to answer'
  a.style.color = '#adbac7'
  a.style.padding = '4px 8px'
  // a.style.background = 'linear-gradient(to right, #f857a6, #ff5858)'
  a.style.borderRadius = '10px'
  a.style.fontSize = '9px'
  a.style.fontFamily =
    "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji'"
  // a.style.fontFamily = "'Amazon ember', 'Open Sans', sans-serif"
  // a.style.boxShadow = 'rgb(0 0 0 / 35%) 0px 3px 6px'
  // a.style.textDecoration = 'none'
  a.style.cursor = 'pointer'

  div.append(a)

  // Start hidden
  div.style.display = 'none'

  return div
}

/**
 *
 * @param {"idle"|"loading"|"error"|"success"} state
 */
function setTriggerElementState(state, message) {
  const ele = document.querySelector('#github-to-openai a')
  switch (state) {
    case 'idle':
      ele.innerText = '👉 Ask OpenAI what to answer'
      ele.style.color = '#adbac7'
      ele.style.background = 'none'
      break
    case 'loading':
      ele.innerText = '⌛ Asking to OpenAI...'
      ele.style.color = '#adbac7'
      ele.style.background = 'linear-gradient(to right, #f857a6, #ff5858)'
      break
    case 'error':
      ele.innerText = `❌ Error! ${message || ''}`
      ele.style.color = '#fff'
      ele.style.background = '#f05a5a'
      break
    case 'success':
      ele.innerText = '✔️ Copied suggestion to clipboard!'
      ele.style.color = '#fff'
      ele.style.background = 'linear-gradient(to right, #268a3d, #46a686)'
      break
  }
}

function setVisible(element, isVisible) {
  element.style.display = isVisible ? 'block' : 'none'
}

/** @deprecated Not used anymore */
async function askToGpt3(text) {
  const myUsername = getGitHubUsername()
  const res = await GM_fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPEN_AI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt:
        `This is a conversation on GitHub. My username is "${myUsername}".` +
        'Your goal is to answer to this conversation with an appropriate response.\n\n' +
        +`Conversation content:` +
        `\n\n===============\n\n` +
        text +
        `\n\n===============\n\n` +
        `Response:\n\n@${myUsername}:\n${text}`,
      model: 'text-davinci-003',
      max_tokens: 256,
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }),
  })
  if (res.status < 200 && res.status >= 300) {
    throw new Error(`${res.status} - ${res.statusText} - ${await res.json()}`)
  }
  return res.json()
}

async function askToChatGPT(text) {
  const myUsername = getGitHubUsername()
  const prompt = {
    messages: [
      {
        role: 'system',
        content: `You are an experienced GitHub user with the pseudo "${myUsername}", that is answering to a discussion, an issue, or a pull request - and try your best to give helpful and appropriate responses`,
      },
      {
        role: 'user',
        content:
          `This is a conversation on GitHub. Your username is "${myUsername}".\n` +
          `You are an experienced GitHub user that is answering to a discussion, an issue, or a pull request - and try your best to give helpful and appropriate responses.\n` +
          `Please answer it by trying your best to be helpful.\n\n` +
          `Additional instructions:\n` +
          `- You are user "@${myUsername}", you must answer to others, not yourself!\n` +
          `- Your responses must be positive\n` +
          `- If you need to criticize or suggest something, you try to list multiple arguments in a coherent fashion, to be as constructive as possible\n` +
          `- Try to not write too big paragraphs of text, instead you must add spacings or go to line or break line often to make your response easier to read\n` +
          `- Take the global context but remember that you should probably give an answer related to the latest messages in the whole conversation\n` +
          `- Your response must not contain anything other than the content of the answer itself\n\n` +
          `Here is the conversation content that you must answer to:` +
          `\n\n###############\n\n` +
          text,
      },
    ],
  }
  const res = await GM_fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPEN_AI_API_KEY}`,
    },
    body: JSON.stringify({
      ...prompt,
      model: 'gpt-3.5-turbo',
      max_tokens: 256,
      temperature: 0.5,
    }),
  })

  if (res.status < 200 && res.status >= 300) {
    throw new Error(`${res.status} - ${res.statusText} - ${await res.json()}`)
  }
  return { ...(await res.json()), prompt }
}

function GM_fetch(url, opt) {
  function blobTo(to, blob) {
    if (to == 'arrayBuffer' && blob.arrayBuffer) return blob.arrayBuffer()
    return new Promise((resolve, reject) => {
      var fileReader = new FileReader()
      fileReader.onload = function (event) {
        if (to == 'base64') resolve(event.target.result)
        else resolve(event.target.result)
      }
      if (to == 'arrayBuffer') fileReader.readAsArrayBuffer(blob)
      else if (to == 'base64') fileReader.readAsDataURL(blob) // "data:*/*;base64,......"
      else if (to == 'text') fileReader.readAsText(blob, 'utf-8')
      else reject('unknown to')
    })
  }
  return new Promise((resolve, reject) => {
    // https://www.tampermonkey.net/documentation.php?ext=dhdg#GM_xmlhttpRequest
    opt = opt || {}
    opt.url = url
    opt.data = opt.body
    opt.responseType = 'blob'
    opt.onload = resp => {
      var blob = resp.response
      resp.blob = () => Promise.resolve(blob)
      resp.arrayBuffer = () => blobTo('arrayBuffer', blob)
      resp.text = () => blobTo('text', blob)
      resp.json = async () => JSON.parse(await blobTo('text', blob))
      resolve(resp)
    }
    opt.ontimeout = () => reject('fetch timeout')
    opt.onerror = () => reject('fetch error')
    opt.onabort = () => reject('fetch abort')
    GM_xmlhttpRequest(opt)
  })
}

const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const port = Number(process.env.LUDI_PROGRAMMATION_PORT || 4300)
const dataFile = path.resolve(__dirname, '../src/assets/programmation/data.json')
const devPassword = process.env.LUDI_DATES_PASSWORD || 'ludi1997'
const sessions = new Map()
const oneHourDelay = 3600

function readShows() {
  if (!fs.existsSync(dataFile)) {
    return []
  }
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
}

function saveShows(shows) {
  const normalized = shows.map(normalizeShow).sort(compareShowDates)
  fs.writeFileSync(dataFile, `${JSON.stringify(normalized, null, 2)}\n`)
  return normalized
}

function normalizeShow(show) {
  return {
    id: show.id || `show-${Date.now()}`,
    name: String(show.name || '').trim(),
    date: toInt(show.date),
    description: String(show.description || ''),
    shortDescription: String(show.shortDescription || ''),
    price: toInt(show.price),
    reducedPrice: toInt(show.reducedPrice),
    freeForStudents: Boolean(show.freeForStudents),
    location: String(show.location || '').trim(),
    imgLink: String(show.imgLink || '').trim(),
    logoLink: String(show.logoLink || '').trim(),
    reservationLink: String(show.reservationLink || '').trim(),
    isPublished: Boolean(show.isPublished),
    isHighlighted: Boolean(show.isHighlighted),
  }
}

function publicShows(shows) {
  const now = Math.floor(Date.now() / 1000)
  return shows
    .map(normalizeShow)
    .filter((show) => (
      show.isPublished &&
      show.name &&
      show.date &&
      show.location &&
      show.date + oneHourDelay >= now
    ))
    .sort(compareShowDates)
}

function compareShowDates(a, b) {
  return (a.date || 0) - (b.date || 0)
}

function toInt(value) {
  return value === null || value === undefined || value === '' ? 0 : Number.parseInt(value, 10) || 0
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
  })
}

function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.cookie || '')
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [key, ...value] = item.split('=')
        return [key, decodeURIComponent(value.join('='))]
      })
  )
}

function currentSession(request) {
  const sid = parseCookies(request).ludi_dates_session
  return sid ? sessions.get(sid) : undefined
}

function json(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': 'http://127.0.0.1:4200',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    ...headers,
  })
  response.end(JSON.stringify(payload))
}

function unauthorized(response) {
  json(response, 401, { error: 'Connexion requise' })
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  const action = url.searchParams.get('action') || ''

  if (request.method === 'OPTIONS') {
    json(response, 204, {})
    return
  }

  try {
    if (action === 'login') {
      const body = await readBody(request)
      if (body.password !== devPassword) {
        json(response, 401, { error: 'Mot de passe incorrect' })
        return
      }

      const sid = crypto.randomBytes(24).toString('hex')
      const csrfToken = crypto.randomBytes(24).toString('hex')
      sessions.set(sid, { csrfToken })
      json(response, 200, { authenticated: true, csrfToken }, {
        'Set-Cookie': `ludi_dates_session=${encodeURIComponent(sid)}; HttpOnly; SameSite=Strict; Path=/assets/programmation`,
      })
      return
    }

    if (action === 'logout') {
      const sid = parseCookies(request).ludi_dates_session
      if (sid) {
        sessions.delete(sid)
      }
      json(response, 200, { ok: true }, {
        'Set-Cookie': 'ludi_dates_session=; Max-Age=0; Path=/assets/programmation',
      })
      return
    }

    if (action === 'session') {
      const session = currentSession(request)
      json(response, 200, {
        authenticated: Boolean(session),
        csrfToken: session?.csrfToken || '',
      })
      return
    }

    if (action === 'admin') {
      const session = currentSession(request)
      if (!session) {
        unauthorized(response)
        return
      }

      if (request.method === 'GET') {
        json(response, 200, readShows())
        return
      }

      if (request.headers['x-csrf-token'] !== session.csrfToken) {
        json(response, 403, { error: 'Session expirée' })
        return
      }

      const body = await readBody(request)
      json(response, 200, saveShows(Array.isArray(body) ? body : []))
      return
    }

    json(response, 200, publicShows(readShows()))
  } catch (error) {
    json(response, 500, { error: 'Erreur locale de gestion des dates' })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`[dates] Serveur local prêt sur http://127.0.0.1:${port}/assets/programmation`)
  console.log(`[dates] Mot de passe local : ${devPassword}`)
})

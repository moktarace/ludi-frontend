const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const port = Number(process.env.LUDI_PROGRAMMATION_PORT || 4300)
const dataFile = path.resolve(__dirname, '../src/assets/programmation/data.json')
const uploadDir = path.resolve(__dirname, '../src/assets/programmation/uploads')
const uploadUrl = 'assets/programmation/uploads'
const kitLogoDir = path.resolve(__dirname, '../src/assets/logo/kit')
const kitLogoUrl = 'assets/logo/kit'
const devPassword = process.env.LUDI_DATES_PASSWORD || 'ludi1997'
const sessions = new Map()
const oneHourDelay = 3600
const maxUploadBytes = 8 * 1024 * 1024

function ensureDataFile() {
  if (fs.existsSync(dataFile)) {
    return
  }

  fs.mkdirSync(path.dirname(dataFile), { recursive: true })
  fs.writeFileSync(dataFile, '[]\n')
}

function readShows() {
  ensureDataFile()
  if (!fs.existsSync(dataFile)) {
    return []
  }
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
}

function saveShows(shows) {
  const normalized = shows.map(normalizeShow).sort(compareShowDates)
  fs.writeFileSync(dataFile, `${JSON.stringify(normalized, null, 2)}\n`)
  cleanupUnusedUploads(normalized)
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

function mediaLibrary() {
  return {
    kitLogos: listMediaFiles(kitLogoDir, kitLogoUrl, 'logo'),
    uploads: listMediaFiles(uploadDir, uploadUrl, 'upload'),
  }
}

function listMediaFiles(directory, baseUrl, kind) {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory)
    .filter(isAllowedImageName)
    .sort((a, b) => mediaLabel(a).localeCompare(mediaLabel(b)))
    .map((file) => ({
      label: mediaLabel(file),
      url: `${baseUrl}/${encodeURIComponent(file)}`,
      kind,
    }))
}

function uploadMedia(body) {
  const mimeType = String(body.mimeType || '')
  const fileName = sanitizeFilename(String(body.fileName || 'image'))
  const dataUrl = String(body.dataUrl || '')

  if (!['image/jpeg', 'image/png'].includes(mimeType) || !/^data:image\/(jpeg|png);base64,/.test(dataUrl)) {
    throw new Error('Format refusé. Utilise une image JPEG ou PNG.')
  }

  const binary = Buffer.from(dataUrl.replace(/^data:image\/(jpeg|png);base64,/, ''), 'base64')
  if (!binary.length || binary.length > maxUploadBytes || !isValidImageBuffer(binary, mimeType)) {
    throw new Error('Image invalide ou trop lourde')
  }

  fs.mkdirSync(uploadDir, { recursive: true })
  const extension = mimeType === 'image/png' ? 'png' : 'jpg'
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
  const targetName = `${fileName}-${stamp}-${crypto.randomBytes(4).toString('hex')}.${extension}`
  fs.writeFileSync(path.join(uploadDir, targetName), binary)

  return {
    label: mediaLabel(targetName),
    url: `${uploadUrl}/${encodeURIComponent(targetName)}`,
    kind: 'upload',
  }
}

function cleanupUnusedUploads(shows) {
  if (!fs.existsSync(uploadDir)) {
    return
  }

  const used = new Set()
  for (const show of shows) {
    for (const field of ['logoLink']) {
      const value = String(show[field] || '')
      if (value.startsWith(`${uploadUrl}/`)) {
        used.add(path.basename(decodeURIComponent(value)))
      }
    }
  }

  for (const file of fs.readdirSync(uploadDir)) {
    if (isAllowedImageName(file) && !used.has(file)) {
      fs.unlinkSync(path.join(uploadDir, file))
    }
  }
}

function isValidImageBuffer(buffer, mimeType) {
  if (mimeType === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9
}

function isAllowedImageName(file) {
  return /\.(jpe?g|png)$/i.test(file)
}

function sanitizeFilename(fileName) {
  return (path.parse(fileName).name || 'image')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image'
}

function mediaLabel(file) {
  return (path.parse(file).name || 'image')
    .replace(/-\d{8}t\d{6}-[a-f0-9]{8}$/i, '')
    .replace(/-/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > maxUploadBytes * 2) {
        request.destroy()
        reject(new Error('Requête trop lourde'))
      }
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

function serveUploadedFile(requestPath, response) {
  const prefix = '/assets/programmation/uploads/'
  if (!requestPath.startsWith(prefix)) {
    return false
  }

  const file = path.basename(decodeURIComponent(requestPath.slice(prefix.length)))
  const filePath = path.join(uploadDir, file)
  if (!isAllowedImageName(file) || !fs.existsSync(filePath)) {
    response.writeHead(404)
    response.end()
    return true
  }

  response.writeHead(200, {
    'Content-Type': /\.png$/i.test(file) ? 'image/png' : 'image/jpeg',
    'Cache-Control': 'public, max-age=3600',
  })
  fs.createReadStream(filePath).pipe(response)
  return true
}

function unauthorized(response) {
  json(response, 401, { error: 'Connexion requise' })
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  const action = url.searchParams.get('action') || ''

  if (serveUploadedFile(url.pathname, response)) {
    return
  }

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

    if (action === 'media') {
      const session = currentSession(request)
      if (!session) {
        unauthorized(response)
        return
      }
      json(response, 200, mediaLibrary())
      return
    }

    if (action === 'upload') {
      const session = currentSession(request)
      if (!session) {
        unauthorized(response)
        return
      }
      if (request.headers['x-csrf-token'] !== session.csrfToken) {
        json(response, 403, { error: 'Session expirée' })
        return
      }
      const body = await readBody(request)
      json(response, 200, uploadMedia(body))
      return
    }

    json(response, 200, publicShows(readShows()))
  } catch (error) {
    json(response, 500, { error: 'Erreur locale de gestion des dates' })
  }
})

server.listen(port, '127.0.0.1', () => {
  ensureDataFile()
  console.log(`[dates] Serveur local prêt sur http://127.0.0.1:${port}/assets/programmation`)
  console.log(`[dates] Mot de passe local : ${devPassword}`)
})

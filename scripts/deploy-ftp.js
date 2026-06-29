const fs = require('fs')
const path = require('path')
const posix = require('path').posix
const ftp = require('basic-ftp')

const localDir = path.resolve(__dirname, '../dist/ludi-frontend')
const remoteDir = process.env.FTP_REMOTE_DIR || '/www'
const protectedPaths = [
  'assets/programmation/config.php',
  'assets/programmation/data.json',
  'assets/programmation/uploads',
]

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variable ${name} manquante`)
  }
  return value
}

function isProtected(relativePath) {
  const normalized = relativePath.split(path.sep).join('/')
  return protectedPaths.some((protectedPath) => (
    normalized === protectedPath ||
    normalized.startsWith(`${protectedPath}/`)
  ))
}

function listFiles(directory, base = directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return listFiles(absolutePath, base)
    }

    const relativePath = path.relative(base, absolutePath)
    return isProtected(relativePath) ? [] : [{ absolutePath, relativePath }]
  })
}

async function uploadFile(client, file) {
  const remotePath = posix.join(remoteDir, file.relativePath.split(path.sep).join('/'))
  await client.ensureDir(posix.dirname(remotePath))
  await client.uploadFrom(file.absolutePath, remotePath)
  console.log(`upload ${file.relativePath}`)
}

async function main() {
  if (!fs.existsSync(localDir)) {
    throw new Error('Build introuvable. Lance npm run build avant le deploiement.')
  }

  const files = listFiles(localDir)
  if (process.env.FTP_DRY_RUN === '1') {
    console.log(`Dry-run FTP vers ${remoteDir}`)
    files.forEach((file) => console.log(`upload ${file.relativePath}`))
    return
  }

  const client = new ftp.Client()
  client.ftp.verbose = process.env.FTP_VERBOSE === '1'

  try {
    await client.access({
      host: requiredEnv('FTP_HOST'),
      user: requiredEnv('FTP_USER'),
      password: requiredEnv('FTP_PASSWORD'),
      secure: process.env.FTP_SECURE === '1',
    })

    for (const file of files) {
      await uploadFile(client, file)
    }
  } finally {
    client.close()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

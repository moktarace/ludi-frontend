const { spawn } = require('child_process')
const fs = require('fs')
const net = require('net')
const os = require('os')
const path = require('path')

const node = process.execPath
const ngBin = path.resolve(__dirname, '../node_modules/.bin/ng')

const children = []

function spawnManaged(command, args, options) {
  const child = spawn(command, args, options)
  children.push(child)
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stopAll('SIGTERM')
      process.exit(code)
    }
  })
  return child
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '127.0.0.1')
  })
}

async function findFreePort(start) {
  for (let port = start; port < start + 100; port += 1) {
    if (await isPortFree(port)) {
      return port
    }
  }

  throw new Error(`Aucun port libre trouvé à partir de ${start}`)
}

async function main() {
  const appPort = await findFreePort(4200)
  const datesPort = await findFreePort(4300)
  const proxyPath = path.join(os.tmpdir(), `ludi-frontend-proxy-${process.pid}.json`)

  fs.writeFileSync(proxyPath, JSON.stringify({
    '/assets/programmation': {
      target: `http://127.0.0.1:${datesPort}`,
      secure: false,
      changeOrigin: true,
    },
  }, null, 2))

  console.log(`[app] Lancement sur http://127.0.0.1:${appPort}/`)

  spawnManaged(node, [path.resolve(__dirname, './dev-programmation-api.js')], {
    env: {
      ...process.env,
      LUDI_PROGRAMMATION_PORT: String(datesPort),
    },
    stdio: 'inherit',
  })

  spawnManaged(ngBin, [
    'serve',
    '--host',
    '127.0.0.1',
    '--port',
    String(appPort),
    '--proxy-config',
    proxyPath,
  ], {
    stdio: 'inherit',
  })
}

function stopAll(signal) {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal)
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopAll(signal)
    process.exit(0)
  })
}

main().catch((error) => {
  console.error(error.message)
  stopAll('SIGTERM')
  process.exit(1)
})

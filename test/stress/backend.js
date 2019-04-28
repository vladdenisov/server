#!/usr/bin/env node

let delay = require('nanodelay')
let chalk = require('chalk')
let http = require('http')

function send (action, meta) {
  let body = JSON.stringify({
    version: 0,
    password: 'secret',
    commands: [
      ['action', action, meta]
    ]
  })
  return new Promise((resolve, reject) => {
    let req = http.request({
      method: 'POST',
      host: 'localhost',
      port: 31338,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        reject(new Error('Logux error'))
      } else {
        process.stdout.write(chalk.blue('R'))
        resolve()
      }
    })
    req.on('error', reject)
    req.end(body)
  })
}

let server = http.createServer((req, res) => {
  let body = ''
  req.on('data', data => {
    body += data
  })
  req.on('end', async () => {
    try {
      let data = JSON.parse(body)
      let [type, action, meta] = data.commands[0]
      let nodes = [meta.id.split(' ')[1]]
      await delay(500)
      res.write(`[["approved","${ meta.id }"]`)
      if (type === 'action' && action.type === 'logux/subscribe') {
        await delay(300)
        await send({ type: 'project/name', value: 'A' }, { nodes })
        await send({ type: 'project/status', value: 'ok' }, { nodes })
        await send({ type: 'project/payment', value: 'paid' }, { nodes })
        process.stdout.write(chalk.green('S'))
      } else if (type === 'action' && action.type === 'project/name') {
        await delay(500)
        process.stdout.write(chalk.yellow('A'))
      }
      res.write(`,["processed","${ meta.id }"]]`)
      res.end()
    } catch (e) {
      process.stderr.write(chalk.red(e.stack))
      process.exit(1)
    }
  })
})

server.listen(31339)

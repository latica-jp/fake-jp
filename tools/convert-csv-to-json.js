const fs = require('fs')
const csv = require('fast-csv')

module.exports = async (srcPath, destPath, headers, step = 1) => {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(srcPath)
    const ws = fs.createWriteStream(destPath)
    ws.write('{\n')
    ws.write('\t"data": [\n')
    const ps = csv.parse({ headers })
    let isFirst = true
    let count = step
    ps.on('data', row => {
      if ((count -= 1) > 0) return
      else count = count === 0 ? step : count
      if (!isFirst) ws.write(',\n')
      else isFirst = false
      ws.write(`\t\t${JSON.stringify(row)}`)
    })
    ps.on('error', error => reject(error))
    ps.on('end', () => {
      ws.write('\n')
      ws.write('\t]\n')
      ws.write('}\n')
      resolve()
    })
    rs.pipe(ps)
  })
}

const archiver = require('archiver')
const { createWriteStream } = require('fs')

function make_pkg(data, name, ver) {
  const archive = archiver('tar')
  const output = createWriteStream(`${__dirname}/packages/${name}/${ver}.tar`)
  archive.pipe(output)
  for (const fn in data) {
    if (typeof fn == 'string') {
      archive.append(data[fn], { name: fn })
    } else {
      res.status(400).send({ message: 'Invalid data.' })
    }
  }
  archive.finalize()
} 

module.exports = {
  make_pkg
}
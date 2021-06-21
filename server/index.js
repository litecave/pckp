const express = require('express')
const fs = require('fs')
const { make_pkg } = require('./pkg')
const { DB } = require('./db')

const app = express()
const db = new DB('/Users/JLOLC/projects/spwn-pkg/server/packages.json')

app.use(express.json())

app.get('/api/package/:pkg', (req, res) => {
  if (req.params.pkg in db.get_key('packages')) {
    res.status(200).send(db.get_key(`packages/${req.params.pkg}`))
  } else {
    res.status(404).send({ message: 'Package not found.' })
  }
})

app.post('/api/publish', (req, res) => {
  if (
      !(req.body.version in (db.get_key(`packages/${req.body.name}/versions`) || []))
    ) {
    const name = req.body.name,
      desc = req.body.desc,
      long_desc = req.body.long_desc || '',
      homepage = req.body.homepage || null,
      version = req.body.version,
      author = req.body.author,
      data = req.body.data,
      comb = {
        name, desc, long_desc, homepage,
        versions: (db.get_key(`packages/${name}/versions`) || []).concat(version),
        author };

    if (fs.existsSync(`${__dirname}/packages/${name}/${version}.zip`)) {
      res.status(400).send({ message: 'Package version already exists.' })
      return
    }

    if (Object.values(comb).some(val => val === undefined)) {
      res.status(400).send({ message: 'Some data is undefined.' })
      return
    }

    if (!version.split('').every(c => '0123456789.'.includes(c))) {
      res.status(400).send({ message: 'Package version is invalid.' })
      return
    }

    if (!fs.existsSync(`${__dirname}/packages/${name}`))
      fs.mkdirSync(`${__dirname}/packages/${name}`)

    if (
      author != (db.get_key(`packages/${name}/author`) || author) ||
      name != (db.get_key(`packages/${name}/name`) || name)
    ) {
      res.status(400).send({ message: 'Name or author cannot be changed.' })
      return
    }

    db.set_key(`packages/${name}`, comb)

    make_pkg(data, name, version)

    res.status(200).send({ message: 'Published successfully!' })
  } else {
    res.status(409).send({ message: 'Package already exists.' })
  }
})

app.get('/api/package/:pkg/download', (req, res) => {
  const name = req.params.pkg.split('-')[0]
  const ver = req.params.pkg.split('-')[1]

  if (!ver) {
    res.status(400).send({ message: 'Version not defined.' })
    return
  }
  
  if (name in db.get_key('packages')) {
    if (!(ver in db.get_key(`packages/${name}/versions`))) {
      res.status(404).send('Version not found.')
      return
    }

    res.status(200).download(
      `${__dirname}/packages/${name}/${
        req.params.pkg.split('-')[1]
      }.zip`, `${name}-${ver}.zip`
    )
  } else {
    res.status(404).send({ message: 'Package not found.' })
  }
})

app.listen(5000, console.log('Listening on post 5000'))
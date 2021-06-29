const express = require('express')
const fs = require('fs')
const { make_pkg } = require('./pkg')
const { DB } = require('./db')
const auth = require('./auth')

const app = express()
const pkg = new DB('./packages.json')
const users = new DB('./users.txt', true, process.env.KEY)
// users.set_key('users', {})
console.log(users.get_key('users'))

app.use(express.json())

app.get('/api/package/:pkg', (req, res) => {
  if (req.params.pkg in pkg.get_key('packages')) {
    res.status(200).send(pkg.get_key(`packages/${req.params.pkg}`))
  } else {
    res.status(404).send({ message: 'Package not found.' })
  }
})

app.post('/api/publish', (req, res) => {
  if (req.body.token == (pkg.get_key(`packages/${req.body.name}/token`) || req.body.token)) {
    if (
        req.body.version in (pkg.get_key(`packages/${req.body.name}/versions`) || [])
      ) {
      const name = req.body.name,
        desc = req.body.desc,
        long_desc = req.body.long_desc || '',
        homepage = req.body.homepage || null,
        version = req.body.version,
        token = req.body.token,
        data = req.body.data
        
      let comb = {
          name, desc, long_desc, homepage, token,
          versions: (pkg.get_key(`packages/${name}/versions`) || []).concat(version) };

      try {
        auth.get_user(token, process.env.KEY)
          .then(user => {
            comb['author'] = user.payload.user
          })
      } catch {
        res.status(404).send({ message: 'Token is invalid.' })
      }

      if (Object.values(comb).some(val => val === undefined)) {
        res.status(422).send({ message: 'Some data is undefined.' })
        return
      }

      if (!version.split('').every(c => '0123456789.'.includes(c))) {
        res.status(422).send({ message: 'Package version is invalid.' })
        return
      }

      if (!fs.existsSync(`${__dirname}/packages/${name}`))
        fs.mkdirSync(`${__dirname}/packages/${name}`)

      if (
        comb.author != (pkg.get_key(`packages/${name}/author`) || comb.author)
      ) {
        res.status(409).send({ message: 'Author cannot be changed.' })
        return
      }

      pkg.set_key(`packages/${name}`, comb)

      make_pkg(data, name, version)

      res.status(200).send({ message: 'Published successfully!' })
    } else {
      res.status(409).send({ message: 'Package version already exists.' })
    }
  } else {
    res.status(403).send({ message: 'You cannot update this package.' })
  }
})

app.get('/api/package/:pkg/download', (req, res) => {
  const name = req.params.pkg.split('-')[0]
  const ver = req.params.pkg.split('-')[1]

  if (!ver) {
    res.status(422).send({ message: 'Version undefined.' })
    return
  }
  
  if (name in pkg.get_key('packages')) {
    if (!pkg.get_key(`packages/${name}/versions`).includes(ver)) {
      res.status(404).send('Version not found.')
      return
    }

    res.status(200).download(
      `${__dirname}/packages/${name}/${ver}.zip`, `${name}-${ver}.zip`
    )
  } else {
    res.status(404).send({ message: 'Package not found.' })
  }
})

app.post('/api/users/register', (req, res) => {
  const user = req.body.user
  const pass = req.body.pass

  if (user && pass) {
    if (user in users.get_key('users')) {
      res.status(409).send({ message: 'User already exists.' })
      return }
    
    users.set_key(`users/${user}`, { pass: auth.hash_pass(pass) })
    auth.create_token(user, process.env.KEY)
      .then(jwt => {
        res.status(200).send({ message: 'User registered successfully!', token: jwt })
      })
  } else {
    res.status(422).send({ message: 'User or password is undefined.' })
  }
})

app.post('/api/users/login', (req, res) => {
  const user = req.body.user
  const pass = req.body.pass

  if (user && pass) {
    if (user in users.get_key('users')) {
      const check_pass = auth.check_pass(user, pass, users)
      
      if (check_pass) {
        auth.create_token(user, process.env.KEY)
          .then(jwt => {
            res.status(200).send({ message: 'Login successful.', token: jwt })
          })
      } else {
        res.status(403).send({ message: 'User or password incorrect.' })
      }
    } else {
      res.status(403).send({ message: 'User or password incorrect.' })
    }
  } else {
    res.status(422).send({ message: 'User or password is undefined.' })
  }
})

app.listen(5000, console.log('Listening on post 5000'))
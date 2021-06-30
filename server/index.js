const express = require('express')
const fs = require('fs')
const { make_pkg } = require('./pkg')
const { DB } = require('./db')
const auth = require('./auth')

const app = express()
const pkg = new DB('./packages.json')
const users = new DB('./users.txt', true, process.env.KEY)
const allowed_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
const allow_chars_usr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
// users.set_key('users', {})
console.log(users.get_key('users'))
console.log(pkg.get_key('packages'))

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
        (pkg.get_key(`packages/${req.body.name}/versions`) || [req.body.version]).includes(req.body.version)
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

      if (!name.split('').every(c => allow_chars_usr.includes(c))) {
        res.status(403).send({ message: 'Package name must only include the alphabet and _.' })
        return }

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
  
  if (name in pkg.get_key('packages')) {
    const versions = pkg.get_key(`packages/${name}/versions`)
    const ver = req.params.pkg.split('-')[1] || versions[versions.length - 1]

    if (!versions.includes(ver)) {
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
      if (pass.length < 1 || pass.length > 25) {
        res.status(403).send({ message: 'Username must be at least 1 characters and at most 25 characters.' })
        return }
      if (!pass.split('').every(c => allow_chars_usr.includes(c))) {
        res.status(403).send({ message: 'Username must only include the alphabet and _.' })
        return }

      if (pass.length < 3 || pass.length > 30) {
        res.status(403).send({ message: 'Password must be at least 3 characters and at most 30 characters.' })
        return }
      if (!pass.split('').every(c => allowed_chars.includes(c))) {
        res.status(403).send({ message: 'Password must only include the alphabet, digits and _.' })
        return }

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
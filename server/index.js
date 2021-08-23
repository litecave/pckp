const express = require('express')
const fs = require('fs')
const sp = require('synchronized-promise')
const ss = require('string-similarity')
const rate_limit = require('express-rate-limit')
const { make_pkg } = require('./pkg')
const { DB } = require('./db')
const auth = require('./auth')

const app = express()
const pkg = new DB('./packages.txt', true, process.env.KEY)
const users = new DB('./users.txt', true, process.env.KEY)
const PORT = 5000
const allowed_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
const allow_chars_usr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
const forbidden_pkg_names = ['std', 'gamescene']
const rate_limiter = new rate_limit({
  windowMs: 60000 * 60,
  max: 15,
  message: { message: 'You have been rate limited. Maximum 15 requests per hour.' }
})
app.use('/api/', rate_limiter)
users.set_key('users', {})
pkg.set_key('packages', {})
console.log(users.get_key('users'))
console.log(pkg.get_key('packages'))

app.use(express.json())

app.get('/api/package/:pkg', (req, res) => {
  if (req.params.pkg in pkg.get_key('packages')) {
    let data = pkg.get_key(`packages/${req.params.pkg}`)
    delete data.token
    res.status(200).send(data)
  } else {
    res.status(404).send({ message: 'Package not found.' })
  }
})

app.get('/api/search', (req, res) => {
  const query = req.query.q
  if (query) {
    const packages = Object.keys(pkg.get_key('packages'))
    if (packages.length == 0) {
      res.status(404).send({ message: 'No packages found.' })
      return } 

    const best_match = ss.findBestMatch(
      query, 
      packages
    )
    const matches = best_match.ratings.sort((a, b) => {
      return a.rating + b.rating
    }).filter(rating => rating.rating > 0.6)
      .map(rating => {
        let { author, versions, name } = pkg.get_key(`packages/${rating.target}`)
        return { 
          name, 
          version: versions[resp.versions.length - 1],
          author 
        } 
      })
    res.status(200).send(matches)
  } else {
    res.status(422).send({ message: 'Search query not provided.' })
  }
})

app.post('/api/publish', (req, res) => {
  if (req.body.token == (pkg.get_key(`packages/${req.body.name}/token`) || req.body.token)) {
    if (
        !(pkg.get_key(`packages/${req.body.name}/versions`) || []).includes(req.body.version)
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

      if (forbidden_pkg_names.includes(name)) {
        res.status(403).send({ message: 'Package name is forbidden to use.' })
      }

      try {
        const user = sp(auth.get_user)(token, process.env.KEY).payload.user
        if (user in users.get_key('users')) {
          comb['author'] = user
        } else {
          throw ''
        }
      } catch {
        res.status(404).send({ message: 'Token is invalid.' })
        return
      }

      if (!name.split('').every(c => allow_chars_usr.includes(c))) {
        res.status(403).send({ message: 'Package name must only include the alphabet and _.' })
        return }

      if (Object.values(comb).some(val => val === undefined)) {
        res.status(422).send({ message: 'Some required fields are not provided.' })
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
      res.status(404).send({ message: 'Version not found.' })
      return
    }

    res.status(200).download(
      `${__dirname}/packages/${name}/${ver}.tar`, `${name}-${ver}.tar`
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

    if (user.length < 1 || user.length > 25) {
      res.status(403).send({ message: 'Username must be at least 1 characters and at most 25 characters.' })
      return }
    if (!user.split('').every(c => allow_chars_usr.includes(c))) {
      res.status(403).send({ message: 'Username must only include the alphabet and _.' })
      return }

    if (pass.length < 3 || pass.length > 30) {
      res.status(403).send({ message: 'Password must be at least 3 characters and at most 30 characters.' })
      return }
    if (!pass.split('').every(c => allowed_chars.includes(c))) {
      res.status(403).send({ message: 'Password must only include the alphabet, digits and _.' })
      return }
    
    auth.hash_pass(pass)
      .then(hash => {
        users.set_key(`users/${user}`, { pass: hash })
      })
    
    auth.create_token(user, process.env.KEY)
      .then(jwt => {
        res.status(200).send({ message: 'User registered successfully!', token: jwt })
      })
  } else {
    res.status(422).send({ message: 'User or password is not provided.' })
  }
})

app.post('/api/users/login', (req, res) => {
  const user = req.body.user
  const pass = req.body.pass

  if (user && pass) {
    if (user in users.get_key('users')) {
      auth.check_pass(user, pass, users)
        .then(check_pass => {
          if (check_pass) {
            auth.create_token(user, process.env.KEY)
              .then(jwt => {
                res.status(200).send({ message: 'Login successful.', token: jwt })
              })
          } else {
            res.status(403).send({ message: 'Incorrect username or password.' })
          }
        })
    } else {
      res.status(403).send({ message: 'Incorrect username or password.' })
    }
  } else {
    res.status(422).send({ message: 'User or password is not provided.' })
  }
})

app.listen(PORT, console.log(`Listening on port ${PORT}`))

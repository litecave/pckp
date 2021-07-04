const { SignJWT } = require('jose/jwt/sign')
const { jwtVerify } = require('jose/jwt/verify')
const { createSecretKey, createHash } = require('crypto')

function create_token(user, key) {
  const jwt = new SignJWT({ user: user })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(createSecretKey(key))

  return jwt
}

function get_user(token, key) {
  return jwtVerify(token, createSecretKey(key))
}

function check_pass(user, pass, db) {
  const hash = hash_pass(pass)
  return hash == db.get_key(`users/${user}/pass`)
}

function hash_pass(pass) {
  console.log(pass)
  return createHash('sha256').update(pass).digest('hex')
}

module.exports = {
  get_user,
  create_token,
  check_pass,
  hash_pass
}
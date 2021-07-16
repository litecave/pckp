const { SignJWT } = require('jose/jwt/sign')
const { jwtVerify } = require('jose/jwt/verify')
const { createSecretKey } = require('crypto')
const argon2 = require('argon2-browser')

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
  return hash_pass(pass)
    .then(res => {
      return res == db.get_key(`users/${user}/pass`)
    })
}

function hash_pass(pass) {
  return argon2.hash({ pass: pass, salt: process.env.KEY })
    .then(res => {
      return res.hashHex
    })
}

module.exports = {
  get_user,
  create_token,
  check_pass,
  hash_pass
}
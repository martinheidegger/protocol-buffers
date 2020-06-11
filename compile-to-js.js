var os = require('os')

var RESERVED = {
  type: true,
  message: true,
  name: true,
  buffer: true,
  encode: true,
  decode: true,
  encodingLength: true,
  dependencies: true
}

function isEncoder (m) {
  return typeof m.encode === 'function'
}

function compile (messages, opts) {
  var out = ''
  var encodings = opts && opts.encodings

  out += '// This file is auto generated by the protocol-buffers compiler' + os.EOL
  out += os.EOL
  out += '/* eslint-disable quotes */' + os.EOL
  out += '/* eslint-disable indent */' + os.EOL
  out += '/* eslint-disable no-redeclare */' + os.EOL
  out += '/* eslint-disable camelcase */' + os.EOL
  out += os.EOL
  if (!encodings) out += '// Remember to `npm install --save protocol-buffers-encodings`' + os.EOL
  out += 'var encodings = require(\'' + (encodings || 'protocol-buffers-encodings') + '\')' + os.EOL
  out += 'var varint = encodings.varint' + os.EOL
  out += 'var skip = encodings.skip' + os.EOL
  out += os.EOL

  visit(messages, 'exports', '')

  function stringifyEnum (map, spaces) {
    const keys = Object.keys(map)
    const safe = keys.every(function (k) {
      if (typeof map[k] !== 'number') return false
      return /^[a-z][a-z0-9]+$/i.test(k)
    })

    if (!safe) return JSON.stringify(map, null, 2).replace(/\n/g, os.EOL) + os.EOL

    var out = '{' + os.EOL

    keys.forEach(function (k, i) {
      out += spaces + '  ' + k + ': ' + map[k] + (i < keys.length - 1 ? ',' : '') + os.EOL
    })

    return out + spaces + '}' + os.EOL
  }

  function visit (messages, exports, spaces) {
    var encoders = Object.keys(messages).filter(function (name) {
      if (RESERVED[name]) return false
      return isEncoder(messages[name])
    })

    var enums = Object.keys(messages).filter(function (name) {
      if (RESERVED[name]) return false
      return !isEncoder(messages[name])
    })

    enums.forEach(function (name) {
      out += spaces + exports + '.' + name + ' = ' +
        stringifyEnum(messages[name], spaces) + os.EOL
    })

    encoders.forEach(function (name) {
      out += spaces + 'var ' + name + ' = ' + exports + '.' + name + ' = {' + os.EOL
      out += spaces + '  buffer: true,' + os.EOL
      out += spaces + '  encodingLength: null,' + os.EOL
      out += spaces + '  encode: null,' + os.EOL
      out += spaces + '  decode: null' + os.EOL
      out += spaces + '}' + os.EOL
      out += os.EOL
    })

    encoders.forEach(function (name) {
      out += spaces + 'define' + name + '()' + os.EOL
    })

    if (encoders.length) out += os.EOL

    encoders.forEach(function (name) {
      out += spaces + 'function define' + name + ' () {' + os.EOL

      visit(messages[name], name, spaces + '  ')

      out += spaces + '  ' + name + '.encodingLength = encodingLength' + os.EOL
      out += spaces + '  ' + name + '.encode = encode' + os.EOL
      out += spaces + '  ' + name + '.decode = decode' + os.EOL + os.EOL
      out += spaces + '  ' + funToString(messages[name].encodingLength, spaces + '  ') + os.EOL + os.EOL
      out += spaces + '  ' + funToString(messages[name].encode, spaces + '  ') + os.EOL + os.EOL
      out += spaces + '  ' + funToString(messages[name].decode, spaces + '  ') + os.EOL
      out += spaces + '}' + os.EOL + os.EOL
    })
  }

  out += funToString(require('./compile').defined, '') + os.EOL

  return out

  function funToString (fn, spaces) {
    return fn.toString().split('\n').map(indent).join('\n')

    function indent (n, i) {
      if (!i) return n.replace(/(function \w+)\(/, '$1 (')
      return spaces + n
    }
  }
}

module.exports = compile

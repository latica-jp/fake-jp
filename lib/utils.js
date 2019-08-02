const jaconv = require('jaconv')

const randomInt = n => Math.floor(Math.random() * Math.floor(n))

const toLowerCaseHebon = katakana => {
  const hiragana = jaconv.toHiragana(katakana)
  return jaconv.toHebon(hiragana).toLowerCase()
}

const generateRandomDigits = digits =>
  `${'0'.repeat(digits - 1)}${randomInt(10 ** digits)}`.slice(-digits)

module.exports = { randomInt, toLowerCaseHebon, generateRandomDigits }

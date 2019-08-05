const { randomInt, toLowerCaseHebon } = require('./utils')
const dict = require('./dict')

const MAX_RETRIES = 10

module.exports = class Fake {
  constructor(options) {
    this.options = options
    this.dict = dict
    this.reset()
  }

  reset() {
    this.usedSetByType = {}
  }

  _createValue(type, creator) {
    return this.options && this.options.unique
      ? this._createUniqueValue(type, creator)
      : creator()
  }

  _createUniqueValue(type, creator) {
    let value
    for (let i = 0; i < MAX_RETRIES; i++) {
      value = creator()
      const uniqueKey = value.uniqueKey || JSON.stringify(value)
      if (value.uniqueKey) delete value.uniqueKey
      let usedSet = this.usedSetByType[type]
      if (!usedSet) {
        usedSet = new Set()
        this.usedSetByType[type] = usedSet
      }
      if (!usedSet.has(uniqueKey)) {
        usedSet.add(uniqueKey)
        return value
      }
    }
    throw new Error('Unique error! Should call reset()')
  }

  _getRandomValueFromDict(type, options) {
    const dict = {
      addresses: this.dict.addresses,
      firstNames: this.dict.firstNames,
      lastNames: this.dict.lastNames,
      areaCodes: this.dict.areaCodes,
    }[type]
    const filteredDict = this._filterDict(dict, type, options)
    return { ...filteredDict[randomInt(filteredDict.length)] }
  }

  _filterDict(dict, type, options) {
    let filter
    if (type === 'firstNames' && options && options.gender) {
      filter = dict =>
        dict.filter(
          word => (word.gender === '男' ? 'male' : 'female') === options.gender
        )
    }
    return filter ? filter(dict) : dict
  }

  _createName(options) {
    const firstName = this._getRandomValueFromDict('firstNames', options)
    const lastName = this._getRandomValueFromDict('lastNames')
    const mailAddress = this._createMailAddress(
      toLowerCaseHebon(firstName.firstNameKana),
      toLowerCaseHebon(lastName.lastNameKana)
    )
    const separator = (options && options.separator) || ' '
    return {
      ...firstName,
      ...lastName,
      fullName: `${lastName.lastName}${separator}${firstName.firstName}`,
      fullNameKana: `${lastName.lastNameKana}${separator}${firstName.firstName}`,
      ...mailAddress,
      uniqueKey: `${lastName.lastName}_${firstName.firstName}`,
    }
  }

  name(options) {
    return this._createValue('name', () => this._createName(options))
  }

  _createFirstName() {
    return this._getRandomValueFromDict('firstNames')
  }

  firstName() {
    return this._createValue('firstNames', () => this._createFirstName())
  }

  _createLastName() {
    return this._getRandomValueFromDict('lastNames')
  }

  _lastName() {
    return this._createUniqueValue('lastNames', () => this._createLastName())
  }

  _createMailAddress(firstName, lastName) {
    const domain = ['fake.com', 'fake.net', 'fakemail.com'][randomInt(3)]
    return {
      mailAddress: `${firstName}${
        ['_', '-', ''][randomInt(3)]
      }${lastName}@${domain}`,
    }
  }

  _createAddress() {
    const getBuildingName = (street, streetKana) => {
      const arr = ['ハイツ', 'コーポ', 'メゾン', 'ヴィラ', 'ハイム', 'シャトー']
      const suffix = arr[randomInt(arr.length)]
      const room = `${randomInt(9) + 1}${`0${randomInt(20)}`.slice(-2)}`
      return Math.random() > 0.5
        ? [`${suffix}${street}${room}`, `${suffix}${streetKana}${room}`]
        : [`${street}${suffix}${room}`, `${streetKana}${suffix}${room}`]
    }
    const address = this._getRandomValueFromDict('addresses')
    address['zipCodeWithHyphen'] = `${address['zipCode'].slice(0, 3)}-${address[
      'zipCode'
    ].slice(3, 7)}`
    const street = address['street']
    const streetKana = address['streetKana']
    const chome = `${randomInt(8) + 1}-${randomInt(50) + 1}-${randomInt(20) +
      1}`
    address['street'] += chome
    address['streetKana'] += chome
    if (Math.random() > 0.3) {
      const [bldg, bldgKana] = getBuildingName(street, streetKana)
      address['street'] += ` ${bldg}`
      address['streetKana'] += ` ${bldgKana}`
    }
    address['fullAddress'] = `${address.state}${address.city}${address.street}`
    return address
  }

  address() {
    return this._createValue('addresses', () => this._createAddress())
  }

  _createPhoneNumber(options, areaCode) {
    const len = areaCode.cityCode.length
    const cityCode = `0000${randomInt(10 ** len - 1)}`.slice(-len)
    const code = `0000${randomInt(10000)}`.slice(-4)
    const [left, right] =
      options && options.delimiter === 'dash'
        ? ['-', '-']
        : options && options.delimiter === 'parenthesis'
        ? ['(', ')']
        : ['', '']
    const phoneNumber = `0${areaCode.areaCode}${left}${cityCode}${right}${code}`
    return phoneNumber
  }

  phoneNumber(options) {
    return this._createValue('phoneNumbers', () => {
      const areaCode = this._getRandomValueFromDict('areaCodes', options)
      return this._createPhoneNumber(options, areaCode)
    })
  }

  mobilePhoneNumber(options) {
    return this._createValue('mobilePhoneNumbers', () => {
      const areaCode = `${randomInt(3) + 7}0`
      return this._createPhoneNumber(options, { areaCode, cityCode: 'CDE' })
    })
  }
}

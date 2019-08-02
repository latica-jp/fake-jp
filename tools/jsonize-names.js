const convertCsvToJson = require('./convert-csv-to-json')

;(async () => {
  await convertCsvToJson(
    './data-source/firstName.csv',
    './data/firstName.json',
    ['firstName', 'firstNameKana', 'gender'],
    6
  )
  await convertCsvToJson(
    './data-source/lastName.csv',
    './data/lastName.json',
    ['lastName', 'lastNameKana'],
    2
  )
})()

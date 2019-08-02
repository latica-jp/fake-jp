const convertCsvToJson = require('./convert-csv-to-json')

;(async () => {
  await convertCsvToJson('./data-source/areaCode.csv', './data/areaCode.json', [
    'areaCode',
    'cityCode',
  ])
})()

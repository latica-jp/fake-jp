const fs = require('fs')
const csv = require('csv')
const iconv = require('iconv-lite')
const jaconv = require('jaconv')
const srcPath = './data-source/KEN_ALL.csv'
const outFilterCount = process.argv[2] || 40
console.log({ outFilterCount })

if (!fs.existsSync(srcPath)) {
  console.error('Place KEN_ALL.csv into ./data folder!')
  process.exit(1)
}
const rs = fs.createReadStream(srcPath)
const ws = fs.createWriteStream('./data/address.json', { encoding: 'utf-8' })

const parser = csv.parse({
  columns: [
    '__1',
    '__2',
    'zipCode',
    'stateKana',
    'cityKana',
    'streetKana',
    'state',
    'city',
    'street',
    '__10',
    '__11',
    'hasChome',
    '__13',
    '__14',
    '__15',
  ],
  delimiter: ',',
})

// 全角チルダ（U+FF5E）を波ダッシュ（U+301C）と間違えないように変数化
// iconv-lite が波ダッシュを暗黙に全角チルダに変換する仕様に対応
const ZEN_TILDER = String.fromCharCode(0xff5e)

let inputCount = 0
let outputCount = 0

parser.on('data', chunk => {
  if ((inputCount += 1) % outFilterCount) return
  if (chunk['hasChome'] !== '1' || chunk['street'] === '以下に掲載がない場合')
    return
  const streetRaw = chunk['street']
  // -（）がない or (（〜丁目）かつ 〜が「a、b」または「a 〜 b」という形式
  // （ がない、または「丁目）」で終わっていれば抽出
  const matches = streetRaw.match(/.*（(.*)丁目）/) || []
  const chomeRaw = matches[1]
  let chomeRange
  if (
    chomeRaw &&
    chomeRaw.match(new RegExp(`^[０-９]+(、|${ZEN_TILDER})[０-９]+$`, 'u'))
  ) {
    chomeRange = toHankakuEisu(chomeRaw)
    chunk['chomeRange'] = chomeRange
    chunk['street'] = chunk['street'].match(/(.*)（.*/)[1]
    chunk['streetKana'] = chunk['streetKana'].match(/(.*)\(.*/)[1]
  }
  if (!streetRaw.match(/（/) || chomeRange) {
    chunk['stateKana'] = toZenkakuKana(chunk['stateKana'])
    chunk['cityKana'] = toZenkakuKana(chunk['cityKana'])
    chunk['streetKana'] = toZenkakuKana(chunk['streetKana'])

    if (outputCount) ws.write(',\n')
    ws.write(
      `\t\t${JSON.stringify({
        zipCode: chunk['zipCode'],
        stateKana: chunk['stateKana'],
        cityKana: chunk['cityKana'],
        streetKana: chunk['streetKana'],
        state: chunk['state'],
        city: chunk['city'],
        street: chunk['street'],
        chomeRange: chunk['chomeRange'],
      })}`
    )
    outputCount += 1
  }
})

parser.on('end', () => {
  ws.write('\n')
  ws.write('\t]\n')
  ws.write('}\n')
  console.info(`address.json with ${outputCount} lines generated successfully!`)
})

ws.write('{\n')
ws.write('\t"data": [\n')
rs.pipe(iconv.decodeStream('Shift_JIS')).pipe(parser)

const toHankakuEisu = zenkakuEisu =>
  jaconv
    .toHan(zenkakuEisu)
    .replace('、', ',')
    .replace('~', '-')

const toZenkakuKana = hankakuKana => jaconv.toZen(hankakuKana)

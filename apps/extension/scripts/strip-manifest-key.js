import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const manifestPath = path.join(__dirname, '../build/manifest.json')

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
delete manifest.key
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

console.log('✅ Removed key from manifest.json for release')

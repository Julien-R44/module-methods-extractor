import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'node:path'
import { fileURLToPath } from 'url'
import { test } from '@japa/runner'
import { Extractor } from '../src/index.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const BASE_PATH = join(__dirname, 'fixtures')

const dirs = readdirSync(BASE_PATH).filter((file) => {
  return statSync(join(BASE_PATH, file)).isDirectory()
})

dirs.forEach((dir) => {
  const dirBasePath = join(BASE_PATH, dir)
  test(dir, async ({ assert }) => {
    const source = readFileSync(join(dirBasePath, 'source.ts'), 'utf-8')
    const expected = JSON.parse(readFileSync(join(dirBasePath, 'output.json'), 'utf-8'))
    const actual = new Extractor().extract(source)
    assert.deepEqual(actual, expected)
  })
})

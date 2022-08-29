import type { ParseResult } from '@babel/parser'
import type { File } from '@babel/types'

export interface ExtractorOutput {
  methods: { name: string; lineno: number }[]
  kind: 'class' | 'object'
}

export interface ExtractorOptions {
  filename: string
}

export type Ast = ParseResult<File>

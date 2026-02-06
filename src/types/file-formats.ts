import type { PetriNet } from './petri-net'

/**
 * Supported file formats
 */
export type FileFormat = 'pnml' | 'json' | 'svg' | 'png'

/**
 * Import error details
 */
export interface ImportError {
  line?: number
  message: string
  element?: string
}

/**
 * Result of file import operation
 */
export interface ImportResult {
  success: boolean
  net?: PetriNet
  subNets?: Map<string, PetriNet>
  errors: ImportError[]
  warnings: string[]
}

/**
 * Options for file export
 */
export interface ExportOptions {
  format: FileFormat
  includeLayout: boolean
  includeMetadata: boolean
  filename?: string
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pnml',
  includeLayout: true,
  includeMetadata: true,
}

/**
 * MIME types for file formats
 */
export const MIME_TYPES: Record<FileFormat, string> = {
  pnml: 'application/xml',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
}

/**
 * File extensions for formats
 */
export const FILE_EXTENSIONS: Record<FileFormat, string> = {
  pnml: '.pnml',
  json: '.json',
  svg: '.svg',
  png: '.png',
}

/**
 * Format display names
 */
export const FORMAT_NAMES: Record<FileFormat, string> = {
  pnml: 'PNML (Petri Net Markup Language)',
  json: 'JSON',
  svg: 'SVG Image',
  png: 'PNG Image',
}

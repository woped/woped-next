import type { PetriNet } from '@/types/petri-net'
import type { FileFormat, ImportResult, ExportOptions } from '@/types/file-formats'
import { MIME_TYPES, FILE_EXTENSIONS, DEFAULT_EXPORT_OPTIONS } from '@/types/file-formats'
import { PNMLParser } from './pnmlParser'
import { PNMLWriter } from './pnmlWriter'
import { JSONParser, JSONWriter } from './jsonParser'

/**
 * Main file service for import/export operations
 */
export class FileService {
  private pnmlParser = new PNMLParser()
  private pnmlWriter = new PNMLWriter()
  private jsonParser = new JSONParser()
  private jsonWriter = new JSONWriter()

  /**
   * Import a file and return the parsed PetriNet
   */
  async importFile(file: File): Promise<ImportResult> {
    const content = await file.text()
    const format = this.detectFormat(file.name, content)

    switch (format) {
      case 'pnml':
        return this.pnmlParser.parse(content)
      case 'json':
        return this.jsonParser.parse(content)
      default:
        return {
          success: false,
          errors: [{ message: `Unsupported file format: ${format}` }],
          warnings: [],
        }
    }
  }

  /**
   * Import from string content
   */
  importFromString(content: string, format: FileFormat): ImportResult {
    switch (format) {
      case 'pnml':
        return this.pnmlParser.parse(content)
      case 'json':
        return this.jsonParser.parse(content)
      default:
        return {
          success: false,
          errors: [{ message: `Unsupported format for import: ${format}` }],
          warnings: [],
        }
    }
  }

  /**
   * Export a PetriNet to a file
   * @param net The main net to export
   * @param options Export options
   * @param subNets Optional map of subnet IDs to their PetriNet definitions
   */
  async exportToFile(net: PetriNet, options: Partial<ExportOptions> = {}, subNets?: Map<string, PetriNet>): Promise<void> {
    const opts: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options }
    const content = this.exportToString(net, opts, subNets)
    const mimeType = MIME_TYPES[opts.format]
    const extension = FILE_EXTENSIONS[opts.format]
    const filename = opts.filename || `${net.name}${extension}`

    // Create blob and download
    const blob = new Blob([content], { type: mimeType })
    this.downloadBlob(blob, filename)
  }

  /**
   * Export a PetriNet to a string
   * @param net The main net to export
   * @param options Export options
   * @param subNets Optional map of subnet IDs to their PetriNet definitions (for hierarchical nets)
   */
  exportToString(net: PetriNet, options: ExportOptions, subNets?: Map<string, PetriNet>): string {
    switch (options.format) {
      case 'pnml':
        return this.pnmlWriter.write(net, options, subNets)
      case 'json':
        return this.jsonWriter.write(net, options, subNets)
      default:
        throw new Error(`Unsupported format for string export: ${options.format}`)
    }
  }

  /**
   * Export to Blob (for images or file download)
   */
  async exportToBlob(net: PetriNet, options: ExportOptions): Promise<Blob> {
    const content = this.exportToString(net, options)
    const mimeType = MIME_TYPES[options.format]
    return new Blob([content], { type: mimeType })
  }

  /**
   * Detect file format from filename and content
   */
  detectFormat(filename: string, content: string): FileFormat {
    const ext = filename.split('.').pop()?.toLowerCase()

    // Check by extension first
    if (ext === 'pnml') return 'pnml'
    if (ext === 'json') return 'json'
    if (ext === 'svg') return 'svg'
    if (ext === 'png') return 'png'

    // Check by content
    const trimmedContent = content.trim()
    if (trimmedContent.startsWith('<?xml') || trimmedContent.startsWith('<pnml')) {
      return 'pnml'
    }
    if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
      return 'json'
    }

    // Default to PNML
    return 'pnml'
  }

  /**
   * Trigger file download
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Open file picker dialog
   */
  async openFilePicker(accept: string = '.pnml,.json'): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.onchange = () => {
        const file = input.files?.[0] || null
        resolve(file)
      }
      input.oncancel = () => resolve(null)
      input.click()
    })
  }
}

// Singleton instance
export const fileService = new FileService()

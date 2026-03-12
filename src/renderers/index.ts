export { PDFRenderer, pdfRenderer } from './pdf-renderer';
export { ImageRenderer, imageRenderer } from './image-renderer';
export { TextRenderer, textRenderer } from './text-renderer';
export { MarkdownRenderer, markdownRenderer } from './markdown-renderer';
export { DocxRenderer, docxRenderer } from './docx-renderer';
export { PptxRenderer, pptxRenderer } from './pptx-renderer';
export { XLSXRenderer, xlsxRenderer } from './xlsx-renderer';

import type { Renderer, FileType, RenderContext } from '../types';
import { ErrorCode, createError } from '../utils';
import { pdfRenderer } from './pdf-renderer';
import { imageRenderer } from './image-renderer';
import { textRenderer } from './text-renderer';
import { markdownRenderer } from './markdown-renderer';
import { docxRenderer } from './docx-renderer';
import { pptxRenderer } from './pptx-renderer';
import { xlsxRenderer } from './xlsx-renderer';

const renderers: Renderer[] = [
  pdfRenderer,
  imageRenderer,
  textRenderer,
  markdownRenderer,
  docxRenderer,
  pptxRenderer,
  xlsxRenderer,
];

export function getRenderer(fileType: FileType): Renderer | null {
  return renderers.find((renderer) => renderer.canHandle(fileType)) || null;
}

export async function renderFile(context: RenderContext): Promise<void> {
  const { fileInfo, onError } = context;
  const renderer = getRenderer(fileInfo.fileType);

  if (!renderer) {
    const error = createError(
      ErrorCode.UNSUPPORTED_FORMAT,
      `Unsupported file format: ${fileInfo.extension}`,
      undefined,
      fileInfo.url
    );
    onError?.(error);
    throw error;
  }

  return renderer.render(context);
}

export function destroyRenderer(container: HTMLElement, fileType: FileType): void {
  const renderer = getRenderer(fileType);
  if (renderer && renderer.destroy) {
    renderer.destroy(container);
  }
}

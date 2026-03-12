import type { Renderer, RenderContext } from '../types';
import { ErrorCode, createError, fetchFile } from '../utils';

interface DocxPreviewAPI {
  renderAsync(
    data: Blob | ArrayBuffer | string,
    bodyContainer: HTMLElement,
    styleContainer?: HTMLElement | null,
    options?: {
      className?: string;
      inWrapper?: boolean;
      ignoreWidth?: boolean;
      ignoreHeight?: boolean;
      ignoreFonts?: boolean;
      breakPages?: boolean;
      ignoreLastRenderedPageBreak?: boolean;
      experimental?: boolean;
      trimXmlDeclaration?: boolean;
      useBase64URL?: boolean;
      renderHeaders?: boolean;
      renderFooters?: boolean;
      renderFootnotes?: boolean;
      renderEndnotes?: boolean;
    }
  ): Promise<void>;
}

let docxPreviewPromise: Promise<DocxPreviewAPI> | null = null;

async function loadDocxPreview(): Promise<DocxPreviewAPI> {
  if (docxPreviewPromise) {
    return docxPreviewPromise;
  }

  docxPreviewPromise = import('docx-preview').then((module) => {
    return module as unknown as DocxPreviewAPI;
  });

  return docxPreviewPromise;
}

export class DocxRenderer implements Renderer {
  name = 'docx';
  supportedTypes = ['docx'] as const;

  canHandle(fileType: string): boolean {
    return fileType === 'docx';
  }

  async render(context: RenderContext): Promise<void> {
    const { container, fileInfo, onError, onProgress, onComplete } = context;

    container.innerHTML = '';
    container.classList.add('ufp-docx-container');

    onProgress?.(10);

    try {
      const response = await fetchFile(fileInfo.url);
      onProgress?.(30);

      const blob = await response.blob();
      onProgress?.(50);

      const docxPreview = await loadDocxPreview();
      onProgress?.(60);

      const wrapper = document.createElement('div');
      wrapper.className = 'ufp-docx-wrapper';

      container.appendChild(wrapper);

      await docxPreview.renderAsync(blob, wrapper, null, {
        className: 'ufp-docx-content',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: false,
        trimXmlDeclaration: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      });

      onProgress?.(100);
      onComplete?.();
    } catch (error) {
      const previewError = createError(
        ErrorCode.PARSE_ERROR,
        'Failed to render DOCX document',
        error as Error,
        fileInfo.url
      );
      onError?.(previewError);
      throw previewError;
    }
  }

  destroy(container: HTMLElement): void {
    container.innerHTML = '';
  }
}

export const docxRenderer = new DocxRenderer();

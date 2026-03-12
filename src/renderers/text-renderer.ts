import type { Renderer, RenderContext } from '../types';
import { ErrorCode, createError, fetchFile } from '../utils';

export class TextRenderer implements Renderer {
  name = 'txt';
  supportedTypes = ['txt'] as const;

  canHandle(fileType: string): boolean {
    return fileType === 'txt';
  }

  async render(context: RenderContext): Promise<void> {
    const { container, fileInfo, onError, onProgress, onComplete } = context;

    container.innerHTML = '';
    container.classList.add('ufp-text-container');

    onProgress?.(10);

    try {
      const response = await fetchFile(fileInfo.url);
      onProgress?.(50);

      let text = await response.text();
      onProgress?.(80);

      text = this.sanitizeText(text);

      const pre = document.createElement('pre');
      pre.className = 'ufp-text-content';
      pre.textContent = text;

      const wrapper = document.createElement('div');
      wrapper.className = 'ufp-text-wrapper';
      wrapper.appendChild(pre);

      container.appendChild(wrapper);

      onProgress?.(100);
      onComplete?.();
    } catch (error) {
      const previewError = createError(
        ErrorCode.NETWORK_ERROR,
        'Failed to load text file',
        error as Error,
        fileInfo.url
      );
      onError?.(previewError);
      throw previewError;
    }
  }

  private sanitizeText(text: string): string {
    const nullCharRegex = /\x00/g;
    return text.replace(nullCharRegex, '');
  }

  destroy(container: HTMLElement): void {
    container.innerHTML = '';
  }
}

export const textRenderer = new TextRenderer();

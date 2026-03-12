import type { Renderer, RenderContext } from '../types';
import { ErrorCode, createError, fetchFile } from '../utils';

interface PptxPreviewAPI {
  render(
    options: {
      pptx: Blob | ArrayBuffer;
      targetElement: HTMLElement;
      slideScale?: number;
    }
  ): Promise<void>;
}

let pptxPreviewPromise: Promise<PptxPreviewAPI> | null = null;

async function loadPptxPreview(): Promise<PptxPreviewAPI> {
  if (pptxPreviewPromise) {
    return pptxPreviewPromise;
  }

  pptxPreviewPromise = import('pptx-preview').then((module) => {
    return module as unknown as PptxPreviewAPI;
  });

  return pptxPreviewPromise;
}

export class PptxRenderer implements Renderer {
  name = 'pptx';
  supportedTypes = ['pptx'] as const;

  private scale: number = 1;

  canHandle(fileType: string): boolean {
    return fileType === 'pptx';
  }

  async render(context: RenderContext): Promise<void> {
    const { container, fileInfo, onError, onProgress, onComplete } = context;

    container.innerHTML = '';
    container.classList.add('ufp-pptx-container');

    onProgress?.(10);

    try {
      const response = await fetchFile(fileInfo.url);
      onProgress?.(30);

      const blob = await response.blob();
      onProgress?.(50);

      const pptxPreview = await loadPptxPreview();
      onProgress?.(60);

      const wrapper = document.createElement('div');
      wrapper.className = 'ufp-pptx-wrapper';

      const controls = this.createControls(container);
      container.appendChild(controls);
      container.appendChild(wrapper);

      await pptxPreview.render({
        pptx: blob,
        targetElement: wrapper,
        slideScale: this.scale,
      });

      onProgress?.(100);
      onComplete?.();
    } catch (error) {
      const previewError = createError(
        ErrorCode.PARSE_ERROR,
        'Failed to render PPTX presentation',
        error as Error,
        fileInfo.url
      );
      onError?.(previewError);
      throw previewError;
    }
  }

  private createControls(container: HTMLElement): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'ufp-pptx-controls';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'ufp-pptx-btn ufp-pptx-zoom-in';
    zoomInBtn.textContent = '+';
    zoomInBtn.onclick = () => this.zoomIn(container);

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'ufp-pptx-btn ufp-pptx-zoom-out';
    zoomOutBtn.textContent = '−';
    zoomOutBtn.onclick = () => this.zoomOut(container);

    controls.appendChild(zoomOutBtn);
    controls.appendChild(zoomInBtn);

    return controls;
  }

  private getScaleValue(wrapper: HTMLElement): number {
    const transform = wrapper.style.transform;
    if (!transform) return 1;
    const match = transform.match(/scale\(([^)]+)\)/);
    if (match && match[1]) {
      const scale = parseFloat(match[1]);
      return isNaN(scale) ? 1 : scale;
    }
    return 1;
  }

  private zoomIn(container: HTMLElement): void {
    const wrapper = container.querySelector('.ufp-pptx-wrapper') as HTMLElement;
    if (wrapper) {
      const currentScale = this.getScaleValue(wrapper);
      const newScale = Math.min(currentScale * 1.2, 3);
      wrapper.style.transform = `scale(${newScale})`;
      wrapper.style.transformOrigin = 'top left';
    }
  }

  private zoomOut(container: HTMLElement): void {
    const wrapper = container.querySelector('.ufp-pptx-wrapper') as HTMLElement;
    if (wrapper) {
      const currentScale = this.getScaleValue(wrapper);
      const newScale = Math.max(currentScale / 1.2, 0.5);
      wrapper.style.transform = `scale(${newScale})`;
      wrapper.style.transformOrigin = 'top left';
    }
  }

  destroy(container: HTMLElement): void {
    container.innerHTML = '';
  }
}

export const pptxRenderer = new PptxRenderer();

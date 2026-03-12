import type { Renderer, RenderContext } from '../types';
import { ErrorCode, createError } from '../utils';

interface PDFDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPage>;
}

interface PDFPage {
  view: number[];
  getViewport(options: { scale: number }): PDFViewport;
  render(options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFViewport;
  }): { promise: Promise<void> };
  getTextContent(): Promise<{ items: Array<{ str: string; transform: number[]; width: number; height: number }> }>;
}

interface PDFViewport {
  width: number;
  height: number;
  scale: number;
}

interface PDFJS {
  getDocument(options: { url: string; cMapUrl?: string; cMapPacked?: boolean }): {
    promise: Promise<PDFDocument>;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

let pdfjsPromise: Promise<PDFJS & { version: string }> | null = null;

async function loadPDFJS(): Promise<PDFJS & { version: string }> {
  if (pdfjsPromise) {
    return pdfjsPromise;
  }

  pdfjsPromise = import('pdfjs-dist').then((module) => {
    const pdfjs = module as unknown as PDFJS & { version: string };
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }
    return pdfjs;
  });

  return pdfjsPromise;
}

export class PDFRenderer implements Renderer {
  name = 'pdf';
  supportedTypes = ['pdf'] as const;

  private currentDocument: PDFDocument | null = null;
  private totalPages: number = 0;
  private scale: number = 1;
  private container: HTMLElement | null = null;
  private canvasContainer: HTMLElement | null = null;
  private canvases: HTMLCanvasElement[] = [];
  private isRendering: boolean = false;
  private buttonHandlers: Array<{ element: HTMLButtonElement; handler: EventListener }> = [];

  canHandle(fileType: string): boolean {
    return fileType === 'pdf';
  }

  async render(context: RenderContext): Promise<void> {
    const { container, fileInfo, onError, onProgress, onComplete } = context;

    this.container = container;
    container.innerHTML = '';
    container.classList.add('ufp-pdf-container');

    try {
      const pdfjs = await loadPDFJS();

      onProgress?.(10);

      const loadingTask = pdfjs.getDocument({
        url: fileInfo.url,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
        cMapPacked: true,
      });

      this.currentDocument = await loadingTask.promise;
      this.totalPages = this.currentDocument.numPages;

      onProgress?.(20);

      this.createControls(container);
      this.createCanvasContainer(container);

      await this.renderAllPages(onProgress);

      onProgress?.(100);
      onComplete?.();
    } catch (error) {
      const previewError = createError(
        ErrorCode.PARSE_ERROR,
        'Failed to load PDF document',
        error as Error,
        fileInfo.url
      );
      onError?.(previewError);
      throw previewError;
    }
  }

  private createControls(container: HTMLElement): void {
    const controls = document.createElement('div');
    controls.className = 'ufp-pdf-controls';

    const zoomOutBtn = this.createButton('−', 'ufp-pdf-zoom-out', '缩小');
    const zoomInBtn = this.createButton('+', 'ufp-pdf-zoom-in', '放大');
    const fitWidthBtn = this.createButton('↔', 'ufp-pdf-fit-width', '适应宽度');
    const separator = document.createTextNode(' | ');
    const pageInfo = document.createElement('span');
    pageInfo.className = 'ufp-pdf-page-info';
    pageInfo.innerHTML = `共 <span class="ufp-pdf-total-pages">${this.totalPages}</span> 页`;

    const zoomOutHandler = () => this.zoomOut();
    const zoomInHandler = () => this.zoomIn();
    const fitWidthHandler = () => this.fitToWidth();

    this.buttonHandlers.push(
      { element: zoomOutBtn, handler: zoomOutHandler },
      { element: zoomInBtn, handler: zoomInHandler },
      { element: fitWidthBtn, handler: fitWidthHandler }
    );

    zoomOutBtn.addEventListener('click', zoomOutHandler);
    zoomInBtn.addEventListener('click', zoomInHandler);
    fitWidthBtn.addEventListener('click', fitWidthHandler);

    controls.appendChild(zoomOutBtn);
    controls.appendChild(zoomInBtn);
    controls.appendChild(fitWidthBtn);
    controls.appendChild(separator);
    controls.appendChild(pageInfo);

    container.appendChild(controls);
  }

  private createButton(text: string, className: string, title: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `ufp-pdf-btn ${className}`;
    btn.textContent = text;
    btn.title = title;
    btn.type = 'button';
    return btn;
  }

  private createCanvasContainer(container: HTMLElement): void {
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'ufp-pdf-canvas-container';
    container.appendChild(this.canvasContainer);
  }

  private getContainerWidth(): number {
    if (this.canvasContainer && this.canvasContainer.clientWidth > 0) {
      return this.canvasContainer.clientWidth;
    }
    if (this.container && this.container.clientWidth > 0) {
      return this.container.clientWidth - 40;
    }
    return 800;
  }

  private async renderAllPages(onProgress?: (progress: number) => void): Promise<void> {
    if (!this.currentDocument || !this.canvasContainer || this.isRendering) {
      return;
    }

    this.isRendering = true;
    this.canvases = [];
    this.canvasContainer.innerHTML = '';

    try {
      const firstPage = await this.currentDocument.getPage(1);
      const defaultViewport = firstPage.getViewport({ scale: 1 });
      
      const containerWidth = this.getContainerWidth();
      this.scale = containerWidth / defaultViewport.width;

      for (let i = 1; i <= this.totalPages; i++) {
        const page = await this.currentDocument.getPage(i);
        const viewport = page.getViewport({ scale: this.scale });

        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'ufp-pdf-page-wrapper';

        const canvas = document.createElement('canvas');
        canvas.className = 'ufp-pdf-canvas';

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Unable to get canvas context');
        }

        context.scale(outputScale, outputScale);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        pageWrapper.appendChild(canvas);
        this.canvasContainer.appendChild(pageWrapper);
        this.canvases.push(canvas);

        onProgress?.(20 + Math.floor((i / this.totalPages) * 70));
      }
    } finally {
      this.isRendering = false;
    }
  }

  private async reRenderAllPages(): Promise<void> {
    if (!this.currentDocument || !this.canvasContainer || this.isRendering) {
      return;
    }

    this.isRendering = true;

    try {
      for (let i = 0; i < this.totalPages; i++) {
        const page = await this.currentDocument.getPage(i + 1);
        const viewport = page.getViewport({ scale: this.scale });

        const canvas = this.canvases[i];
        if (!canvas) continue;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const context = canvas.getContext('2d');
        if (!context) continue;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(outputScale, outputScale);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
      }
    } finally {
      this.isRendering = false;
    }
  }

  async zoomIn(): Promise<void> {
    this.scale = Math.min(this.scale * 1.25, 10);
    await this.reRenderAllPages();
  }

  async zoomOut(): Promise<void> {
    this.scale = Math.max(this.scale / 1.25, 0.1);
    await this.reRenderAllPages();
  }

  async fitToWidth(): Promise<void> {
    if (!this.currentDocument || !this.canvasContainer) return;
    
    const firstPage = await this.currentDocument.getPage(1);
    const defaultViewport = firstPage.getViewport({ scale: 1 });
    const containerWidth = this.canvasContainer.clientWidth;
    this.scale = containerWidth / defaultViewport.width;
    
    await this.reRenderAllPages();
  }

  destroy(container: HTMLElement): void {
    this.buttonHandlers.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
    this.buttonHandlers = [];
    this.currentDocument = null;
    this.canvases = [];
    this.canvasContainer = null;
    this.container = null;
    container.innerHTML = '';
  }
}

export const pdfRenderer = new PDFRenderer();

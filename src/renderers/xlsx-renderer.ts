import type { Renderer, RenderContext } from '../types';
import { ErrorCode, createError, fetchFile } from '../utils';
import * as XLSX from 'xlsx';

export class XLSXRenderer implements Renderer {
  name = 'xlsx';
  supportedTypes = ['xlsx', 'xls'] as const;

  private currentWorkbook: XLSX.WorkBook | null = null;
  private container: HTMLElement | null = null;

  canHandle(fileType: string): boolean {
    return fileType === 'xlsx' || fileType === 'xls';
  }

  async render(context: RenderContext): Promise<void> {
    const { container, fileInfo, onError, onProgress, onComplete } = context;

    this.container = container;
    container.innerHTML = '';
    container.classList.add('ufp-xlsx-container');

    onProgress?.(10);

    try {
      const response = await fetchFile(fileInfo.url);
      onProgress?.(30);

      const arrayBuffer = await response.arrayBuffer();
      onProgress?.(50);

      this.currentWorkbook = XLSX.read(arrayBuffer, { type: 'array' });

      if (!this.currentWorkbook.SheetNames.length) {
        throw new Error('No sheets found in workbook');
      }

      const controls = this.createControls(container);
      container.appendChild(controls);

      const wrapper = document.createElement('div');
      wrapper.className = 'ufp-xlsx-wrapper';
      container.appendChild(wrapper);

      this.renderSheet(0);

      onProgress?.(100);
      onComplete?.();
    } catch (error) {
      const previewError = createError(
        ErrorCode.PARSE_ERROR,
        'Failed to render Excel spreadsheet',
        error as Error,
        fileInfo.url
      );
      onError?.(previewError);
      throw previewError;
    }
  }

  private createControls(_container: HTMLElement): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'ufp-xlsx-controls';

    const sheetSelect = document.createElement('select');
    sheetSelect.className = 'ufp-xlsx-sheet-select';

    if (this.currentWorkbook) {
      this.currentWorkbook.SheetNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = name;
        sheetSelect.appendChild(option);
      });
    }

    sheetSelect.onchange = (e) => {
      const target = e.target as HTMLSelectElement;
      this.switchSheet(parseInt(target.value, 10));
    };

    controls.appendChild(sheetSelect);

    return controls;
  }

  private renderSheet(sheetIndex: number): void {
    if (!this.container || !this.currentWorkbook) return;

    const wrapper = this.container.querySelector('.ufp-xlsx-wrapper');
    if (!wrapper) return;

    const sheetName = this.currentWorkbook.SheetNames[sheetIndex];
    const worksheet = this.currentWorkbook.Sheets[sheetName];

    const html = XLSX.utils.sheet_to_html(worksheet, { editable: false });

    wrapper.innerHTML = this.processTableHtml(html);

    const select = this.container.querySelector('.ufp-xlsx-sheet-select') as HTMLSelectElement;
    if (select) {
      select.value = String(sheetIndex);
    }
  }

  private processTableHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');

    if (table) {
      table.className = 'ufp-xlsx-table';

      const cells = table.querySelectorAll('td, th');
      cells.forEach((cell) => {
        const text = cell.textContent || '';
        if (this.isNumeric(text)) {
          cell.classList.add('ufp-numeric');
        }
      });
    }

    return table ? table.outerHTML : html;
  }

  private isNumeric(value: string): boolean {
    return !isNaN(parseFloat(value)) && isFinite(Number(value));
  }

  private switchSheet(sheetIndex: number): void {
    this.renderSheet(sheetIndex);
  }

  destroy(container: HTMLElement): void {
    this.currentWorkbook = null;
    this.container = null;
    container.innerHTML = '';
  }
}

export const xlsxRenderer = new XLSXRenderer();

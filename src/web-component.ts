import { FilePreviewEngine } from './core';
import type { GlobalConfig, PreviewError, LegacyFormatInfo } from './types';

const TEMPLATE = `
<style>
  :host {
    display: block;
    width: 100%;
    height: 500px;
  }
  .ufp-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: auto;
  }
</style>
<div class="ufp-container">
  <slot name="loader"></slot>
  <slot name="error"></slot>
</div>
`;

export class UniversalFilePreviewElement extends HTMLElement {
  private engine: FilePreviewEngine | null = null;
  private container: HTMLElement | null = null;
  private shadow: ShadowRoot;

  static get observedAttributes() {
    return ['src', 'width', 'height', 'class-name', 'config'];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.innerHTML = TEMPLATE;
    this.container = this.shadow.querySelector('.ufp-container');
  }

  connectedCallback() {
    if (this.container && this.src) {
      this.initEngine();
    }
  }

  disconnectedCallback() {
    this.destroyEngine();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'src':
      case 'width':
      case 'height':
        if (this.container) {
          this.initEngine();
        }
        break;
      case 'class-name':
        if (this.container) {
          this.container.className = newValue || 'ufp-container';
        }
        break;
      case 'config':
        if (this.container) {
          this.initEngine();
        }
        break;
    }
  }

  private initEngine() {
    if (!this.container) return;

    this.destroyEngine();

    const config = this.getConfig();

    this.engine = new FilePreviewEngine(this.container, {
      src: this.src,
      width: this.width,
      height: this.height,
      className: this.classNameAttr,
      config,
      onError: (error: PreviewError) => {
        this.dispatchEvent(
          new CustomEvent('error', {
            detail: error,
            bubbles: true,
            composed: true,
          })
        );
      },
      onLoad: () => {
        this.dispatchEvent(
          new CustomEvent('load', {
            bubbles: true,
            composed: true,
          })
        );
      },
      onLegacyFormat: (info: LegacyFormatInfo) => {
        this.dispatchEvent(
          new CustomEvent('legacy-format', {
            detail: info,
            bubbles: true,
            composed: true,
          })
        );
      },
    });
  }

  private destroyEngine() {
    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
  }

  private getConfig(): GlobalConfig | undefined {
    const configAttr = this.getAttribute('config');
    if (configAttr) {
      try {
        return JSON.parse(configAttr);
      } catch {
        console.warn('Invalid config JSON');
      }
    }
    return undefined;
  }

  get src(): string {
    return this.getAttribute('src') || '';
  }

  set src(value: string) {
    this.setAttribute('src', value);
  }

  get width(): string | number | undefined {
    const width = this.getAttribute('width');
    if (width) {
      return /^\d+$/.test(width) ? parseInt(width, 10) : width;
    }
    return undefined;
  }

  set width(value: string | number) {
    this.setAttribute('width', String(value));
  }

  get height(): string | number | undefined {
    const height = this.getAttribute('height');
    if (height) {
      return /^\d+$/.test(height) ? parseInt(height, 10) : height;
    }
    return undefined;
  }

  set height(value: string | number) {
    this.setAttribute('height', String(value));
  }

  get classNameAttr(): string {
    return this.getAttribute('class-name') || 'ufp-container';
  }

  set classNameAttr(value: string) {
    this.setAttribute('class-name', value);
  }

  public refresh(): void {
    this.engine?.refresh();
  }

  public resize(width: string | number, height: string | number): void {
    this.engine?.resize(width, height);
  }

  public getState() {
    return this.engine?.getState();
  }
}

export function registerWebComponent(tagName: string = 'universal-file-preview') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, UniversalFilePreviewElement);
  }
}

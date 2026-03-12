<script setup lang="ts">
import { ref, computed } from 'vue'
import { FilePreview } from 'universal-file-preview/vue'
import type { FileType, GlobalConfig } from 'universal-file-preview'
import '../../src/styles/main.css'

const selectedFile = ref<string>('pdf')
const fileUrl = ref<string>('')
const customUrl = ref<string>('')
const showCustomUrl = ref(false)
const uploadedFileType = ref<FileType | null>(null)

const sampleFiles: Record<string, { url: string; type: FileType; name: string; icon: string }> = {
  pdf: {
    url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    type: 'pdf',
    name: 'PDF 文档',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
  },
  image: {
    url: 'https://picsum.photos/800/600',
    type: 'image',
    name: '图片文件',
    icon: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'
  },
  markdown: {
    url: 'https://raw.githubusercontent.com/markedjs/marked/master/README.md',
    type: 'markdown',
    name: 'Markdown',
    icon: 'M3 5h18v14H3V5zm2 2v10h14V7H5zm2 2h2v6H7V9zm4 0h2v6h-2V9zm4 0h2v6h-2V9z'
  },
  text: {
    url: 'https://raw.githubusercontent.com/vuejs/core/main/README.md',
    type: 'text',
    name: '文本文件',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z'
  }
}

const currentFile = computed(() => {
  if (showCustomUrl.value && customUrl.value) {
    return {
      url: customUrl.value,
      type: uploadedFileType.value || detectFileType(customUrl.value),
      name: '自定义文件',
      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z'
    }
  }
  return sampleFiles[selectedFile.value] || sampleFiles.pdf
})

const globalConfig: GlobalConfig = {
  width: '100%',
  defaultHeight: '500px',
  theme: {
    primaryColor: '#00f5ff',
    errorColor: '#ff3366',
    backgroundColor: 'rgba(10, 15, 30, 0.8)'
  },
  onError: (error) => {
    console.error('预览错误:', error)
  },
  onLoad: () => {
    console.log('文件加载成功')
  }
}

function detectFileType(url: string): FileType {
  const ext = url.split('.').pop()?.toLowerCase()?.split('?')[0] || ''
  const typeMap: Record<string, FileType> = {
    pdf: 'pdf',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    webp: 'image',
    svg: 'image',
    md: 'markdown',
    txt: 'text',
    docx: 'docx',
    xlsx: 'xlsx',
    xls: 'xlsx',
    pptx: 'pptx'
  }
  return typeMap[ext] || 'text'
}

function selectFile(key: string) {
  selectedFile.value = key
  showCustomUrl.value = false
  customUrl.value = ''
  uploadedFileType.value = null
}

function useCustomUrl() {
  showCustomUrl.value = true
  selectedFile.value = ''
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const url = URL.createObjectURL(file)
    customUrl.value = url
    uploadedFileType.value = detectFileTypeFromName(file.name)
    showCustomUrl.value = true
    selectedFile.value = ''
  }
}

function detectFileTypeFromName(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const typeMap: Record<string, FileType> = {
    pdf: 'pdf',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    webp: 'image',
    svg: 'image',
    md: 'markdown',
    txt: 'text',
    docx: 'docx',
    xlsx: 'xlsx',
    xls: 'xlsx',
    pptx: 'pptx'
  }
  return typeMap[ext] || 'text'
}
</script>

<template>
  <div class="cyber-container">
    <div class="grid-bg"></div>
    <div class="scan-line"></div>
    
    <header class="cyber-header">
      <div class="header-glow"></div>
      <div class="logo-section">
        <div class="cyber-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div class="title-section">
          <h1 class="cyber-title">
            <span class="title-text">UNIVERSAL FILE PREVIEW</span>
            <span class="title-glitch" aria-hidden="true">UNIVERSAL FILE PREVIEW</span>
          </h1>
          <p class="cyber-subtitle">// 支持多种文件格式的智能预览系统</p>
        </div>
      </div>
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span class="status-text">SYSTEM ONLINE</span>
      </div>
    </header>

    <div class="cyber-content">
      <aside class="cyber-sidebar">
        <div class="panel-header">
          <div class="panel-icon"></div>
          <span>文件选择器</span>
        </div>
        
        <div class="file-grid">
          <button
            v-for="(file, key) in sampleFiles"
            :key="key"
            :class="['cyber-btn', { active: selectedFile === key && !showCustomUrl }]"
            @click="selectFile(key)"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path :d="file.icon"/>
            </svg>
            <span class="btn-text">{{ file.name }}</span>
            <span class="btn-glow"></span>
          </button>
        </div>

        <div class="divider">
          <span class="divider-text">或者</span>
        </div>

        <div class="input-section">
          <label class="input-label">自定义 URL</label>
          <div class="cyber-input-wrapper">
            <input
              v-model="customUrl"
              type="text"
              placeholder="输入文件链接..."
              class="cyber-input"
              @focus="useCustomUrl"
            />
            <div class="input-border"></div>
          </div>
          <button
            class="cyber-btn primary"
            :disabled="!customUrl"
            @click="useCustomUrl"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span>预览文件</span>
          </button>
        </div>

        <div class="divider">
          <span class="divider-text">本地文件</span>
        </div>

        <label class="cyber-upload">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.md,.txt,.docx,.xlsx,.pptx"
            @change="handleFileSelect"
            hidden
          />
          <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span class="upload-text">上传本地文件</span>
        </label>
      </aside>

      <main class="cyber-main">
        <div class="preview-panel">
          <div class="panel-header">
            <div class="file-info">
              <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path :d="currentFile.icon"/>
              </svg>
              <span class="file-name">{{ currentFile.name }}</span>
            </div>
            <div class="file-meta">
              <span class="meta-badge">{{ currentFile.type.toUpperCase() }}</span>
            </div>
          </div>
          
          <div class="preview-container">
            <div class="preview-border">
              <div class="corner tl"></div>
              <div class="corner tr"></div>
              <div class="corner bl"></div>
              <div class="corner br"></div>
            </div>
            <FilePreview
              :src="currentFile.url"
              :file-type="currentFile.type"
              :config="globalConfig"
              :key="currentFile.url"
            >
              <template #loader>
                <div class="cyber-loader">
                  <div class="loader-ring">
                    <div class="ring-segment"></div>
                    <div class="ring-segment"></div>
                    <div class="ring-segment"></div>
                  </div>
                  <p class="loader-text">正在加载文件...</p>
                  <div class="loader-progress">
                    <div class="progress-bar"></div>
                  </div>
                </div>
              </template>
              <template #error="{ error }">
                <div class="cyber-error">
                  <div class="error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p class="error-message">{{ error?.message }}</p>
                  <p class="error-code">ERROR_CODE: {{ error?.code }}</p>
                </div>
              </template>
            </FilePreview>
          </div>
        </div>
      </main>
    </div>

    <footer class="cyber-footer">
      <div class="footer-content">
        <div class="supported-formats">
          <span class="format-label">支持格式:</span>
          <div class="format-tags">
            <span class="format-tag">PDF</span>
            <span class="format-tag">PNG</span>
            <span class="format-tag">JPG</span>
            <span class="format-tag">GIF</span>
            <span class="format-tag">WebP</span>
            <span class="format-tag">SVG</span>
            <span class="format-tag">MD</span>
            <span class="format-tag">DOCX</span>
            <span class="format-tag">XLSX</span>
            <span class="format-tag">PPTX</span>
          </div>
        </div>
        <div class="version-info">
          <span>v1.0.0</span>
          <span class="separator">|</span>
          <span>BUILD.2024</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  overflow: hidden;
  height: 100%;
}

:root {
  --cyber-bg: #0a0f1e;
  --cyber-bg-light: #111827;
  --cyber-primary: #00f5ff;
  --cyber-secondary: #7b2dff;
  --cyber-accent: #ff3366;
  --cyber-success: #00ff9d;
  --cyber-warning: #ffcc00;
  --cyber-text: #e0e6ed;
  --cyber-text-muted: #6b7a90;
  --cyber-border: rgba(0, 245, 255, 0.2);
  --cyber-glow: 0 0 20px rgba(0, 245, 255, 0.3);
  --cyber-glow-strong: 0 0 40px rgba(0, 245, 255, 0.5);
  --scrollbar-bg: rgba(0, 0, 0, 0.3);
  --scrollbar-thumb: rgba(0, 245, 255, 0.3);
  --scrollbar-thumb-hover: rgba(0, 245, 255, 0.5);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-bg);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
  border: 2px solid var(--scrollbar-bg);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

::-webkit-scrollbar-corner {
  background: var(--scrollbar-bg);
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-bg);
}

body {
  font-family: 'Rajdhani', sans-serif;
  background: var(--cyber-bg);
  height: 100%;
  color: var(--cyber-text);
}

.cyber-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.grid-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.scan-line {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyber-primary), transparent);
  animation: scan 4s linear infinite;
  pointer-events: none;
  z-index: 100;
  opacity: 0.5;
}

@keyframes scan {
  0% { top: 0; opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.5; }
  100% { top: 100%; opacity: 0; }
}

.cyber-header {
  background: linear-gradient(180deg, rgba(10, 15, 30, 0.95) 0%, rgba(10, 15, 30, 0.8) 100%);
  border-bottom: 1px solid var(--cyber-border);
  padding: 20px 30px;
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.header-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyber-primary), transparent);
  box-shadow: var(--cyber-glow);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.cyber-icon {
  width: 50px;
  height: 50px;
  border: 2px solid var(--cyber-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 245, 255, 0.1);
  box-shadow: var(--cyber-glow), inset 0 0 20px rgba(0, 245, 255, 0.1);
}

.cyber-icon svg {
  width: 28px;
  height: 28px;
  color: var(--cyber-primary);
}

.title-section {
  flex: 1;
}

.cyber-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 4px;
  position: relative;
  color: var(--cyber-primary);
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
}

.title-glitch {
  position: absolute;
  top: 0;
  left: 0;
  color: var(--cyber-accent);
  clip-path: inset(0 0 50% 0);
  animation: glitch 3s infinite;
}

@keyframes glitch {
  0%, 90%, 100% { clip-path: inset(0 0 100% 0); }
  92% { clip-path: inset(0 0 30% 0); transform: translate(-2px, 0); }
  94% { clip-path: inset(50% 0 0 0); transform: translate(2px, 0); }
  96% { clip-path: inset(0 0 70% 0); transform: translate(-1px, 0); }
  98% { clip-path: inset(20% 0 0 0); transform: translate(1px, 0); }
}

.cyber-subtitle {
  font-size: 14px;
  color: var(--cyber-text-muted);
  margin-top: 4px;
  letter-spacing: 1px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 255, 157, 0.1);
  border: 1px solid rgba(0, 255, 157, 0.3);
  border-radius: 20px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--cyber-success);
  border-radius: 50%;
  animation: pulse 2s infinite;
  box-shadow: 0 0 10px var(--cyber-success);
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.status-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--cyber-success);
}

.cyber-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
  overflow: hidden;
  min-height: 0;
}

.cyber-sidebar {
  width: 280px;
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.9) 0%, rgba(10, 15, 30, 0.9) 100%);
  border: 1px solid var(--cyber-border);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  height: fit-content;
  position: relative;
  overflow: hidden;
}

.cyber-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--cyber-secondary), var(--cyber-primary), var(--cyber-secondary));
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--cyber-primary);
}

.panel-icon {
  width: 8px;
  height: 8px;
  background: var(--cyber-primary);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

.file-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cyber-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(0, 245, 255, 0.05);
  border: 1px solid rgba(0, 245, 255, 0.2);
  border-radius: 10px;
  color: var(--cyber-text);
  font-family: 'Rajdhani', sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.cyber-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.cyber-btn:hover::before {
  left: 100%;
}

.cyber-btn:hover {
  border-color: var(--cyber-primary);
  background: rgba(0, 245, 255, 0.1);
  box-shadow: var(--cyber-glow);
  transform: translateX(5px);
}

.cyber-btn.active {
  background: linear-gradient(135deg, rgba(0, 245, 255, 0.2) 0%, rgba(123, 45, 255, 0.2) 100%);
  border-color: var(--cyber-primary);
  box-shadow: var(--cyber-glow), inset 0 0 20px rgba(0, 245, 255, 0.1);
}

.cyber-btn.active .btn-icon {
  color: var(--cyber-primary);
}

.cyber-btn.primary {
  background: linear-gradient(135deg, var(--cyber-primary) 0%, var(--cyber-secondary) 100%);
  border: none;
  color: var(--cyber-bg);
  font-weight: 600;
  justify-content: center;
  margin-top: 10px;
}

.cyber-btn.primary:hover {
  box-shadow: var(--cyber-glow-strong);
  transform: translateY(-2px);
}

.cyber-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.btn-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--cyber-text-muted);
  transition: color 0.3s ease;
}

.btn-text {
  flex: 1;
}

.btn-glow {
  position: absolute;
  top: 50%;
  right: 15px;
  width: 6px;
  height: 6px;
  background: var(--cyber-primary);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cyber-btn.active .btn-glow {
  opacity: 1;
  box-shadow: 0 0 10px var(--cyber-primary);
  animation: pulse 2s infinite;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyber-border), transparent);
  margin: 20px 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider-text {
  position: absolute;
  background: var(--cyber-bg-light);
  padding: 0 15px;
  font-size: 12px;
  color: var(--cyber-text-muted);
  letter-spacing: 1px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-label {
  font-size: 12px;
  color: var(--cyber-text-muted);
  letter-spacing: 1px;
}

.cyber-input-wrapper {
  position: relative;
}

.cyber-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--cyber-border);
  border-radius: 8px;
  color: var(--cyber-text);
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  transition: all 0.3s ease;
}

.cyber-input::placeholder {
  color: var(--cyber-text-muted);
}

.cyber-input:focus {
  outline: none;
  border-color: var(--cyber-primary);
  box-shadow: var(--cyber-glow);
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--cyber-primary);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.cyber-input:focus + .input-border {
  width: 100%;
}

.cyber-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 25px;
  background: rgba(0, 245, 255, 0.03);
  border: 2px dashed var(--cyber-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cyber-upload:hover {
  border-color: var(--cyber-primary);
  background: rgba(0, 245, 255, 0.08);
}

.upload-icon {
  width: 32px;
  height: 32px;
  color: var(--cyber-primary);
}

.upload-text {
  font-size: 14px;
  color: var(--cyber-text-muted);
  letter-spacing: 1px;
}

.cyber-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.preview-panel {
  flex: 1;
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.9) 0%, rgba(10, 15, 30, 0.9) 100%);
  border: 1px solid var(--cyber-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  position: relative;
  min-height: 0;
}

.preview-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--cyber-primary), var(--cyber-secondary), var(--cyber-accent));
}

.preview-panel .panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--cyber-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  flex-shrink: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  width: 24px;
  height: 24px;
  color: var(--cyber-primary);
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--cyber-text);
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.meta-badge {
  padding: 4px 12px;
  background: rgba(123, 45, 255, 0.2);
  border: 1px solid rgba(123, 45, 255, 0.4);
  border-radius: 4px;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--cyber-secondary);
}

.preview-container {
  flex: 1;
  padding: 0;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.preview-container > .ufp-container {
  height: 100% !important;
}

.preview-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--cyber-primary);
}

.corner.tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.corner.tr { top: 0; right: 0; border-left: none; border-bottom: none; }
.corner.bl { bottom: 0; left: 0; border-right: none; border-top: none; }
.corner.br { bottom: 0; right: 0; border-left: none; border-top: none; }

.cyber-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1;
}

.loader-ring {
  width: 80px;
  height: 80px;
  position: relative;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

.ring-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: var(--cyber-primary);
  border-radius: 50%;
}

.ring-segment:nth-child(1) { animation: ring-pulse 1.5s infinite; }
.ring-segment:nth-child(2) { animation: ring-pulse 1.5s infinite 0.5s; transform: scale(0.8); }
.ring-segment:nth-child(3) { animation: ring-pulse 1.5s infinite 1s; transform: scale(0.6); }

@keyframes ring-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.loader-text {
  margin-top: 30px;
  font-size: 16px;
  color: var(--cyber-text-muted);
  letter-spacing: 2px;
  animation: text-flicker 2s infinite;
}

@keyframes text-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loader-progress {
  width: 200px;
  height: 3px;
  background: rgba(0, 245, 255, 0.1);
  border-radius: 2px;
  margin-top: 20px;
  overflow: hidden;
}

.progress-bar {
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, var(--cyber-primary), var(--cyber-secondary));
  animation: progress-slide 1.5s infinite;
}

@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.cyber-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1;
  padding: 40px;
}

.error-icon {
  width: 60px;
  height: 60px;
  color: var(--cyber-accent);
  animation: error-pulse 2s infinite;
}

@keyframes error-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.error-message {
  margin-top: 20px;
  font-size: 18px;
  color: var(--cyber-accent);
  text-align: center;
}

.error-code {
  margin-top: 10px;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  color: var(--cyber-text-muted);
  letter-spacing: 2px;
}

.cyber-footer {
  background: rgba(10, 15, 30, 0.95);
  border-top: 1px solid var(--cyber-border);
  padding: 16px 30px;
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.supported-formats {
  display: flex;
  align-items: center;
  gap: 15px;
}

.format-label {
  font-size: 13px;
  color: var(--cyber-text-muted);
  letter-spacing: 1px;
}

.format-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.format-tag {
  padding: 4px 10px;
  background: rgba(0, 245, 255, 0.1);
  border: 1px solid rgba(0, 245, 255, 0.2);
  border-radius: 4px;
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--cyber-primary);
}

.version-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  color: var(--cyber-text-muted);
  letter-spacing: 1px;
}

.separator {
  color: var(--cyber-border);
}

@media (max-width: 900px) {
  .cyber-content {
    flex-direction: column;
    padding: 15px;
  }

  .cyber-sidebar {
    width: 100%;
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .cyber-title {
    font-size: 18px;
    letter-spacing: 2px;
  }

  .status-indicator {
    display: none;
  }

  .footer-content {
    flex-direction: column;
    gap: 15px;
  }
}
</style>

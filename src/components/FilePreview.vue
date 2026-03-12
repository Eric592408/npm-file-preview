<template>
  <div
    ref="containerRef"
    :class="computedClass"
    :style="computedStyle"
  >
    <div 
      v-show="state.loading" 
      class="ufp-loading-wrapper"
    >
      <slot name="loader">
        <div class="ufp-loading">
          <div class="ufp-loading-spinner"></div>
          <div class="ufp-loading-text">Loading...</div>
        </div>
      </slot>
    </div>
    <div 
      v-show="state.error && !state.loading" 
      class="ufp-error-wrapper"
    >
      <slot name="error" :error="state.error">
        <div class="ufp-error">
          <div class="ufp-error-icon">⚠️</div>
          <div class="ufp-error-message">{{ state.error?.message }}</div>
          <div class="ufp-error-code">Error Code: {{ state.error?.code }}</div>
        </div>
      </slot>
    </div>
    <div 
      ref="previewContainerRef" 
      class="ufp-preview-container"
      v-show="!state.loading && !state.error"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { PropType } from 'vue';
import { FilePreviewEngine, DEFAULT_CONFIG } from '../core';
import type {
  GlobalConfig,
  PreviewError,
  LegacyFormatInfo,
  PreviewState,
  FileType,
} from '../types';

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  fileType: {
    type: String as PropType<FileType>,
    default: undefined,
  },
  width: {
    type: [String, Number],
    default: undefined,
  },
  height: {
    type: [String, Number],
    default: undefined,
  },
  className: {
    type: String,
    default: 'ufp-container',
  },
  style: {
    type: Object as PropType<Record<string, string | number>>,
    default: undefined,
  },
  config: {
    type: Object as PropType<GlobalConfig>,
    default: undefined,
  },
});

const emit = defineEmits<{
  (e: 'error', error: PreviewError): void;
  (e: 'load'): void;
  (e: 'legacy-format', info: LegacyFormatInfo): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const previewContainerRef = ref<HTMLElement | null>(null);
const engine = ref<FilePreviewEngine | null>(null);
const isInitialized = ref(false);
const state = ref<PreviewState>({
  loading: false,
  error: null,
  fileInfo: null,
  rendered: false,
});

const computedClass = computed(() => {
  return props.className || 'ufp-container';
});

const computedStyle = computed(() => {
  const width = props.width ?? props.config?.defaultWidth ?? DEFAULT_CONFIG.defaultWidth;
  const height = props.height ?? props.config?.defaultHeight ?? DEFAULT_CONFIG.defaultHeight;

  const baseStyle: Record<string, string> = {
    width: typeof width === 'number' ? `${width}px` : width || '100%',
    height: typeof height === 'number' ? `${height}px` : height || '500px',
  };

  if (props.style) {
    Object.entries(props.style).forEach(([key, value]) => {
      baseStyle[key] = String(value);
    });
  }

  return baseStyle;
});

const initEngine = async () => {
  if (!previewContainerRef.value) {
    await nextTick();
  }
  
  if (!previewContainerRef.value) {
    console.error('Preview container not found');
    return;
  }

  if (engine.value) {
    engine.value.destroy();
    engine.value = null;
  }

  previewContainerRef.value.innerHTML = '';

  engine.value = new FilePreviewEngine(previewContainerRef.value, {
    src: props.src,
    fileType: props.fileType,
    width: props.width,
    height: props.height,
    className: 'ufp-content',
    style: props.style,
    config: props.config,
    onError: (error) => {
      state.value.error = error;
      state.value.loading = false;
      emit('error', error);
    },
    onLoad: () => {
      state.value.loading = false;
      state.value.rendered = true;
      emit('load');
    },
    onLegacyFormat: (info) => {
      emit('legacy-format', info);
    },
  });

  const engineState = engine.value.getState();
  state.value = { ...engineState };
};

const refresh = () => {
  if (engine.value) {
    engine.value.refresh();
  }
};

const resize = (width: string | number, height: string | number) => {
  if (engine.value) {
    engine.value.resize(width, height);
  }
};

watch(() => props.src, () => {
  if (!isInitialized.value) return;
  state.value = {
    loading: true,
    error: null,
    fileInfo: null,
    rendered: false,
  };
  nextTick(() => {
    initEngine();
  });
});

watch(() => props.config, () => {
  if (!isInitialized.value) return;
  nextTick(() => {
    initEngine();
  });
}, { deep: true });

onMounted(() => {
  state.value.loading = true;
  nextTick(() => {
    initEngine();
    isInitialized.value = true;
  });
});

onUnmounted(() => {
  if (engine.value) {
    engine.value.destroy();
    engine.value = null;
  }
});

defineExpose({
  refresh,
  resize,
  getState: () => state.value,
});
</script>

<style scoped>
.ufp-preview-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.ufp-loading-wrapper,
.ufp-error-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  height: 100%;
  background: var(--ufp-bg-color, #fafafa);
}
</style>

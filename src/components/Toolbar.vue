<script>
export default {
    name: 'Toolbar',

    props: {
        isMarkerMode: {
            type: Boolean,
            default: false,
        },
        isLineMode: {
            type: Boolean,
            default: false,
        },
        isRulerMode: {
            type: Boolean,
            default: false,
        },
        draftLength: {
            type: Number,
            default: 0,
        },
        hint: {
            type: String,
            default: '',
        },
        selectedMarker: {
            type: Object,
            default: null,
        },
        selectedLine: {
            type: Object,
            default: null,
        },
    },

    emits: ['activate-markers', 'activate-line', 'activate-ruler', 'undo-point', 'finish-line'],

    methods: {
        handleActivateMarkers() {
            this.$emit('activate-markers')
        },

        handleActivateLine() {
            this.$emit('activate-line')
        },

        handleActivateRuler() {
            this.$emit('activate-ruler')
        },

        handleUndoPoint() {
            this.$emit('undo-point')
        },

        handleFinishLine() {
            this.$emit('finish-line')
        },
    },
}
</script>

<template>
    <div class="toolbar" role="toolbar" aria-label="Инструменты карты">
        <button type="button" :class="{ active: isMarkerMode }" @click="handleActivateMarkers">
            Метка
        </button>
        <button type="button" :class="{ active: isLineMode }" @click="handleActivateLine">
            Линия
        </button>

        <template v-if="isLineMode">
            <button type="button" :disabled="draftLength === 0" @click="handleUndoPoint">
                Точку назад
            </button>
            <button type="button" :disabled="draftLength < 2" @click="handleFinishLine">
                Завершить
            </button>
        </template>
    </div>

    <p v-if="!selectedMarker && !selectedLine" class="hint">{{ hint }}</p>
</template>

<style scoped>
.toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 5px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(4px);
}

.toolbar button {
    padding: 8px 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #1f2937;
    font: inherit;
    font-size: 14px;
    line-height: 1.2;
    cursor: pointer;
}

.toolbar button:hover:not(:disabled):not(.active) {
    background: #eef2f7;
}

.toolbar button.active {
    background: #2b7de9;
    color: #fff;
}

.toolbar button:disabled {
    opacity: 0.4;
    cursor: default;
}

.hint {
    max-width: 100%;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    color: #4b5563;
    font-size: 13px;
    line-height: 1.35;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
</style>

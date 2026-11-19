<script>
export default {
    name: 'MarkerMenu',

    props: {
        selectedMarker: {
            type: Object,
            default: null,
        },
        markerTypes: {
            type: Array,
            default: () => [],
        },
        markerColors: {
            type: Array,
            default: () => [],
        },
    },

    emits: ['close', 'update:type', 'update:color', 'update:title', 'update:description', 'delete'],

    methods: {
        handleClose() {
            this.$emit('close')
        },

        handleColorChange(color) {
            this.$emit('update:color', color)
        },

        handleTypeChange(type) {
            this.$emit('update:type', type)
        },

        handleTitleChange(title) {
            this.$emit('update:title', title)
        },

        handleDescriptionChange(description) {
            this.$emit('update:description', description)
        },

        handleDelete() {
            this.$emit('delete')
        },
    },
}
</script>

<template>
    <div v-if="selectedMarker" class="marker-menu" aria-label="Настройки метки">
        <div class="marker-menu__header">
            <strong>Метка</strong>
            <button type="button" class="marker-menu__close" aria-label="Закрыть" @click="handleClose">
                ×
            </button>
        </div>

        <label class="field">
            <span>Вид</span>
            <select v-model="selectedMarker.type" @change="handleTypeChange(selectedMarker.type)">
                <option v-for="type in markerTypes" :key="type.id" :value="type.id">
                    {{ type.label }}
                </option>
            </select>
        </label>

        <div class="field">
            <span>Цвет</span>
            <div class="colors">
                <button v-for="color in markerColors" :key="color" type="button" class="color"
                    :class="{ active: selectedMarker.color === color }" :style="{ background: color }"
                    :aria-label="color" :aria-pressed="selectedMarker.color === color"
                    @click="handleColorChange(color)"></button>
            </div>
        </div>

        <label class="field">
            <span>Название</span>
            <input :value="selectedMarker.title" type="text" maxlength="80" placeholder="Например, кафе у дома"
                @input="handleTitleChange($event.target.value)" />
        </label>

        <label class="field">
            <span>Описание</span>
            <textarea :value="selectedMarker.description" rows="3" maxlength="500" placeholder="Добавьте описание"
                @input="handleDescriptionChange($event.target.value)"></textarea>
        </label>

        <button type="button" class="delete-marker" @click="handleDelete">
            Удалить метку
        </button>
    </div>
</template>

<style scoped>
.marker-menu {
    width: 300px;
    max-width: 100%;
    max-height: calc(100svh - 100px);
    overflow-y: auto;
    padding: 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(4px);
    color: #1f2937;
    font-size: 13px;
}

.marker-menu__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 14px;
}

.marker-menu__close {
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #6b7280;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
}

.marker-menu__close:hover {
    background: #eef2f7;
    color: #1f2937;
}

.field {
    display: block;
    margin-bottom: 10px;
}

.field>span {
    display: block;
    margin-bottom: 4px;
    color: #4b5563;
    font-size: 12px;
}

.field input,
.field select,
.field textarea {
    box-sizing: border-box;
    width: 100%;
    padding: 7px 9px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    color: #1f2937;
    font: inherit;
    font-size: 13px;
}

.field textarea {
    min-height: 64px;
    resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
    border-color: #2b7de9;
    outline: 2px solid rgba(43, 125, 233, 0.35);
    outline-offset: 1px;
}

.type-option-text {
    display: inline-block;
    vertical-align: middle;
    margin-right: 6px;
}

.colors {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.color {
    width: 24px;
    height: 24px;
    padding: 0;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 1px #d1d5db;
    cursor: pointer;
}

.color:hover {
    transform: scale(1.08);
}

.color.active {
    box-shadow: 0 0 0 2px #2b7de9;
}

.delete-marker {
    width: 100%;
    padding: 8px 12px;
    border: 0;
    border-radius: 8px;
    background: #fdecea;
    color: #c62828;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
}

.delete-marker:hover {
    background: #fbd9d5;
}
</style>

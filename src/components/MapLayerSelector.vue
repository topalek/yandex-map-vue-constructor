<script>
export default {
    name: 'MapLayerSelector',

    props: {
        isSchemeMap: {
            type: Boolean,
            default: false,
        },
        isSatelliteMap: {
            type: Boolean,
            default: false,
        },
        isHybridMap: {
            type: Boolean,
            default: false,
        },
    },

    emits: ['set-scheme', 'set-satellite', 'set-hybrid'],

    methods: {
        handleSetScheme() {
            this.$emit('set-scheme')
        },

        handleSetSatellite() {
            this.$emit('set-satellite')
        },

        handleSetHybrid() {
            this.$emit('set-hybrid')
        },
    },
}
</script>

<template>
    <div class="map-layer-selector" role="group" aria-label="Тип карты">
        <button type="button" :class="{ active: isSchemeMap }" :aria-pressed="isSchemeMap" @click="handleSetScheme">
            Схема
        </button>
        <button type="button" :class="{ active: isSatelliteMap }" :aria-pressed="isSatelliteMap"
            @click="handleSetSatellite">
            Спутник
        </button>
        <button type="button" :class="{ active: isHybridMap }" :aria-pressed="isHybridMap" @click="handleSetHybrid">
            Гибрид
        </button>
    </div>
</template>

<style scoped>
.map-layer-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 5px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(4px);
}

.map-layer-selector button {
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

.map-layer-selector button:hover:not(:disabled):not(.active) {
    background: #eef2f7;
}

.map-layer-selector button.active {
    background: #2b7de9;
    color: #fff;
}

.map-layer-selector button:disabled {
    opacity: 0.4;
    cursor: default;
}
</style>

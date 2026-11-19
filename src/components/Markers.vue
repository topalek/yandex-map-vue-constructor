<script>
import { markRaw } from 'vue'
import { YandexMapMarker } from 'vue-yandex-maps'

export default {
    name: 'Markers',

    components: {
        YandexMapMarker,
    },

    props: {
        markers: {
            type: Array,
            required: true,
        },
        editingMarkerId: {
            type: Number,
            default: null,
        },
        selectedLineId: {
            type: Number,
            default: null,
        },
        rulerPoints: {
            type: Array,
            default: () => [],
        },
        markerTypes: {
            type: Array,
            default: () => [],
        },
        markerColors: {
            type: Array,
            default: () => [],
        },
        suppressClick: {
            type: Boolean,
            default: false,
        },
    },

    emits: ['edit-marker', 'marker-click'],

    data() {
        return {
            draggedMarkerId: null,
            markerDragMoved: false,
            mapBehaviorsBeforeDrag: null,
            clickGuardTimer: null,
        }
    },

    computed: {
        selectedMarker() {
            return (
                this.markers.find((marker) => marker.id === this.editingMarkerId) || null
            )
        },
    },

    methods: {
        getIconStyle(typeId) {
            const type = this.markerTypes.find((item) => item.id === typeId)
            if (!type || !type.iconPath) {
                return {}
            }
            return {
                backgroundImage: `url(${type.iconPath})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }
        },

        handleMarkerClick(markerId) {
            if (this.suppressClick) {
                return
            }
            this.$emit('marker-click', markerId)
        },

        openMarkerMenu(markerId) {
            this.$emit('edit-marker', markerId)
        },

        startMarkerDrag(id) {
            this.draggedMarkerId = id
            this.markerDragMoved = false
        },

        handleMarkerDragMove() {
            this.markerDragMoved = true
        },

        endMarkerDrag(markerId, coordinates) {
            const moved = this.markerDragMoved && this.draggedMarkerId === markerId
            this.draggedMarkerId = null
            this.markerDragMoved = false

            if (!coordinates) {
                return
            }

            const point = [coordinates[0], coordinates[1]]
            this.$emit('marker-drag-end', markerId, point)

            if (moved) {
                this.guardClick()
            }
        },

        guardClick() {
            this.$emit('suppress-click')
            window.clearTimeout(this.clickGuardTimer)
            this.clickGuardTimer = window.setTimeout(() => {
                this.$emit('suppress-click', false)
            }, 300)
        },

        markerTypeIcon(typeId) {
            const type = this.markerTypes.find((item) => item.id === typeId)
            if (!type || !type.iconPath) return ''
            return type.iconPath
        },

        markerTypeLabel(typeId) {
            const type = this.markerTypes.find((item) => item.id === typeId)
            return type ? type.label : 'Метка'
        },

        markerTooltip(marker) {
            const parts = []
            if (marker.title) {
                parts.push(marker.title)
            }
            if (marker.description) {
                parts.push(marker.description)
            }
            return parts.length > 0 ? parts.join('\n') : this.markerTypeLabel(marker.type)
        },
    },

    beforeUnmount() {
        window.clearTimeout(this.clickGuardTimer)
    },
}
</script>

<template>
    <div class="markers">
        <!-- Существующие метки -->
        <YandexMapMarker v-for="marker in markers" :key="marker.id" :settings="{ coordinates: marker.coordinates }"
            draggable="true" :zIndex="1400" :onDragStart="() => startMarkerDrag(marker.id)"
            :onDragMove="handleMarkerDragMove" :onDragEnd="(coordinates) => endMarkerDrag(marker.id, coordinates)"
            position="top left-center">
            <button type="button" class="marker-pin" :class="{ active: editingMarkerId === marker.id }"
                :style="{ background: marker.color }" :title="markerTooltip(marker)"
                :aria-label="marker.title || markerTypeLabel(marker.type)" @click.stop="openMarkerMenu(marker.id)">
                <span class="marker-pin__icon" :style="getIconStyle(marker.type)" aria-hidden="true"></span>
            </button>
        </YandexMapMarker>

    </div>
</template>

<style scoped>
.markers {
    position: relative;
    width: 0;
    height: 0;
}

.marker-pin {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.marker-pin:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.marker-pin.active {
    transform: scale(1.15);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
}

.marker-pin__icon {
    width: 24px;
    height: 24px;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ruler-point {
    display: block;
    width: 12px;
    height: 12px;
    border: 2px solid #e11d48;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.ruler-point::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background: #e11d48;
    border-radius: 50%;
}
</style>

<script>
import { YandexMapMarker } from 'vue-yandex-maps'
import { HugeiconsIcon } from '@hugeicons/vue'
import Location01Icon from '@hugeicons/core-free-icons/Location01Icon'

export default {
    name: 'Markers',

    components: {
        YandexMapMarker,
        HugeiconsIcon,
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

        markerIcon(typeId) {
            const type = this.markerTypes.find((item) => item.id === typeId)
            return type && type.icon ? type.icon : Location01Icon
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
                :title="markerTooltip(marker)"
                :aria-label="marker.title || markerTypeLabel(marker.type)" @click.stop="openMarkerMenu(marker.id)">
                <HugeiconsIcon class="marker-pin__icon" :icon="markerIcon(marker.type)" :size="20"
                    :color="marker.color" :stroke-width="1.8" aria-hidden="true" />
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
    background: #fff;
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
    display: block;
    pointer-events: none;
}
</style>

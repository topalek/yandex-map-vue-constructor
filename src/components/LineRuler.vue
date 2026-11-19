<script>
import { YandexMapMarker, YandexMapFeature } from 'vue-yandex-maps'

export default {
    name: 'LineRuler',

    components: {
        YandexMapMarker,
        YandexMapFeature,
    },

    props: {
        rulerPoints: {
            type: Array,
            default: () => [],
            required: true,
        },
        rulerSegments: {
            type: Array,
            default: () => [],
        },
        rulerTotal: {
            type: Number,
            default: 0,
        },
        rulerTotalLabel: {
            type: String,
            default: '0 м',
        },
        isRulerMode: {
            type: Boolean,
            default: false,
        },
        draft: {
            type: Array,
            default: () => [],
        },
        draftStyle: {
            type: Object,
            default: () => ({}),
        },
        suppressClick: {
            type: Boolean,
            default: false,
        },
        onRulerClick: {
            type: Function,
            default: () => { },
        },
    },

    emits: ['ruler-point-click'],

    data() {
        return {
            draggedPointIndex: null,
            pointDragMoved: false,
            mapBehaviorsBeforeDrag: null,
            clickGuardTimer: null,
        }
    },

    methods: {
        handleRulerPointClick(index, event) {
            if (this.suppressClick) {
                return
            }
            this.$emit('ruler-point-click', index)
        },

        startPointDrag(index, event) {
            if (!this.map) {
                return
            }

            this.draggedPointIndex = index
            this.pointDragMoved = false
            this.mapBehaviorsBeforeDrag = this.map.behaviors
                ? [...this.map.behaviors]
                : null

            if (this.mapBehaviorsBeforeDrag) {
                try {
                    this.map.setBehaviors(
                        this.mapBehaviorsBeforeDrag.filter(
                            (behavior) => behavior !== 'drag'
                        )
                    )
                } catch (error) {
                    this.mapBehaviorsBeforeDrag = null
                }
            }

            if (event && event.currentTarget && event.currentTarget.setPointerCapture) {
                try {
                    event.currentTarget.setPointerCapture(event.pointerId)
                } catch (error) {
                    // pointer capture is optional
                }
            }

            window.addEventListener('pointerup', this.endPointDrag)
            window.addEventListener('pointercancel', this.endPointDrag)
        },

        handlePointerMove(object, event) {
            if (!this.draggedPointIndex !== null || !event || !event.coordinates) {
                return
            }

            const point = [event.coordinates[0], event.coordinates[1]]
            this.$emit('ruler-point-drag', this.draggedPointIndex, point)
        },

        endPointDrag() {
            window.removeEventListener('pointerup', this.endPointDrag)
            window.removeEventListener('pointercancel', this.endPointDrag)

            const wasDragging = this.draggedPointIndex !== null

            if (this.map && this.mapBehaviorsBeforeDrag) {
                try {
                    this.map.setBehaviors(this.mapBehaviorsBeforeDrag)
                } catch (error) {
                    // behaviors will be restored on the next drag
                }
            }
            this.mapBehaviorsBeforeDrag = null
            this.draggedPointIndex = null

            if (!wasDragging) {
                return
            }

            this.$emit('suppress-click')
            window.clearTimeout(this.clickGuardTimer)
            this.clickGuardTimer = window.setTimeout(() => {
                this.$emit('suppress-click', false)
            }, 350)
        },

        guardClick() {
            this.$emit('suppress-click')
            window.clearTimeout(this.clickGuardTimer)
            this.clickGuardTimer = window.setTimeout(() => {
                this.$emit('suppress-click', false)
            }, 300)
        },
    },

    beforeUnmount() {
        window.clearTimeout(this.clickGuardTimer)
    },
}
</script>

<template>
    <div class="line-ruler">
        <!-- Чертёж линии -->
        <YandexMapFeature v-if="!isRulerMode && draft.length >= 2" :settings="{
            geometry: { type: 'LineString', coordinates: draft },
            style: draftStyle,
            zIndex: 1600,
        }" />

        <!-- Точки линейки (двигаемые) -->
        <YandexMapMarker v-for="(point, index) in rulerPoints" :key="'ruler-point-' + index"
            :settings="{ coordinates: point }" position="top left-center">
            <span class="ruler-point" :class="{ 'ruler-point--active': draggedPointIndex === index }"
                @pointerdown.stop.prevent="startPointDrag(index, $event)"
                @click.stop="handleRulerPointClick(index, $event)"></span>
        </YandexMapMarker>

        <!-- Сегменты линейки с подписями расстояния -->
        <div v-for="segment in rulerSegments" :key="segment.id" class="ruler-label">
            <div class="ruler-label__line" :style="{
                left: (segment.midpoint[0] - 25) + 'px',
                top: (segment.midpoint[1] + 15) + 'px',
                transform: 'translate(-50%, 0) rotate(-45deg)',
            }">
                <span class="ruler-label__text">{{ segment.distance.toFixed(1) }} м</span>
            </div>
        </div>

        <!-- Точки черновика -->
        <YandexMapMarker v-for="(point, index) in draft" :key="'draft-point-' + index"
            :settings="{ coordinates: point }" position="top left-center">
            <span class="draft-point"></span>
        </YandexMapMarker>
    </div>
</template>

<style scoped>
.line-ruler {
    position: relative;
    width: 0;
    height: 0;
}

.ruler-point {
    display: block;
    width: 12px;
    height: 12px;
    border: 2px solid #e11d48;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    cursor: grab;
    touch-action: none;
}

.ruler-point:hover {
    transform: scale(1.15);
}

.ruler-point--active {
    background: #e11d48;
    border-color: #fff;
    cursor: grabbing;
}

.ruler-label {
    position: absolute;
    pointer-events: none;
    transform-origin: center;
}

.ruler-label__line {
    position: absolute;
    width: 50px;
    height: 2px;
    background: #e11d48;
    transform: rotate(-45deg);
}

.ruler-label__text {
    display: block;
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    font-size: 11px;
    color: #1f2937;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.draft-point {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #2b7de9;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}
</style>

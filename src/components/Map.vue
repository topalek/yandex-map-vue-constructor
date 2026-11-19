<script>
import { markRaw } from 'vue'
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapListener,
  YandexMapFeature,
} from 'vue-yandex-maps'
import YandexMapHybridLabelsLayer from './YandexMapHybridLabelsLayer.vue'
import YandexMapDefaultSatelliteLayer from './YandexMapDefaultSatelliteLayer.vue'
import Markers from './Markers.vue'
import MarkerMenu from './MarkerMenu.vue'
import LineRuler from './LineRuler.vue'
import Toolbar from './Toolbar.vue'
import MapLayerSelector from './MapLayerSelector.vue'

const MODE_MARKER = 'marker'
const MODE_LINE = 'line'
const MODE_RULER = 'ruler'

const MAP_TYPE_SCHEME = 'scheme'
const MAP_TYPE_SATELLITE = 'satellite'
const MAP_TYPE_HYBRID = 'hybrid'

const INITIAL_CENTER = [37.990024, 44.940178]

const MARKER_TYPES = [
  { id: 'bs', label: 'БС', icon: '🏠', iconPath: '/marker-icons/bs.png' },
  { id: 'bs-mbt', label: 'БС МБТ', icon: '🏢', iconPath: '/marker-icons/bs-mbt.png' },
  { id: 'tkd', label: 'ТКД', icon: '🚧', iconPath: '/marker-icons/tkd.png' },
  { id: 'camera', label: 'Камера', icon: '📷', iconPath: '/marker-icons/camera.png' },
  { id: 'cabinet', label: 'Шкаф', icon: '🗄️', iconPath: '/marker-icons/cabinet.png' },
  { id: 'coupling', label: 'Муфта', icon: '🔗', iconPath: '/marker-icons/coupling.png' },
  { id: 'subscriber', label: 'Абонент', icon: '👤', iconPath: '/marker-icons/subscriber.png' },
  { id: 'support', label: 'Опора', icon: '⚡', iconPath: '/marker-icons/support.png' },
  { id: 'cross', label: 'Кросс', icon: '🔀', iconPath: '/marker-icons/cross.png' },
  { id: 'other', label: 'Другое', icon: '📍', iconPath: '/marker-icons/other.png' },
]

const MARKER_COLORS = [
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#2b7de9',
  '#5856d6',
  '#af52de',
  '#8e8e93',
]

const DEFAULT_MARKER_TYPE = MARKER_TYPES[MARKER_TYPES.length - 1].id
const DEFAULT_MARKER_COLOR = MARKER_COLORS[0]

const LINE_COLORS = [
  '#2b7de9',
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#5856d6',
  '#af52de',
  '#1f2937',
]

const LINE_TYPES = [
  { id: 'solid', label: 'Сплошная', dash: [] },
  { id: 'dashed', label: 'Пунктирная', dash: [10, 8] },
  { id: 'dotted', label: 'Точечная', dash: [2, 6] },
  { id: 'dashdot', label: 'Штрихпунктирная', dash: [12, 6, 2, 6] },
]

const DEFAULT_LINE_TYPE = LINE_TYPES[0].id
const DEFAULT_LINE_COLOR = LINE_COLORS[0]
const DEFAULT_LINE_WIDTH = 4

const METERS_PER_DEGREE = 111320

function distanceToSegment(point, start, end) {
  const latFactor = Math.cos((point[1] * Math.PI) / 180)
  const ax = (start[0] - point[0]) * METERS_PER_DEGREE * latFactor
  const ay = (start[1] - point[1]) * METERS_PER_DEGREE
  const bx = (end[0] - point[0]) * METERS_PER_DEGREE * latFactor
  const by = (end[1] - point[1]) * METERS_PER_DEGREE

  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy
  let t = 0
  if (lengthSquared > 0) {
    t = -(ax * dx + ay * dy) / lengthSquared
    t = Math.max(0, Math.min(1, t))
  }

  return Math.hypot(ax + t * dx, ay + t * dy)
}

const EARTH_RADIUS_METERS = 6371008.8

function haversineDistance(from, to) {
  const lat1 = (from[1] * Math.PI) / 180
  const lat2 = (to[1] * Math.PI) / 180
  const deltaLat = lat2 - lat1
  const deltaLng = ((to[0] - from[0]) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)))
}

function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} м`
  }
  return `${(meters / 1000).toFixed(2)} км`
}

export default {
  name: 'MapView',

  components: {
    YandexMap,
    YandexMapDefaultSchemeLayer,
    YandexMapDefaultSatelliteLayer,
    YandexMapHybridLabelsLayer,
    YandexMapDefaultFeaturesLayer,
    YandexMapListener,
    YandexMapFeature,
    Markers,
    MarkerMenu,
    LineRuler,
    Toolbar,
    MapLayerSelector,
  },

  data() {
    return {
      mode: MODE_MARKER,
      mapType: MAP_TYPE_SCHEME,
      map: null,
      markers: [
        {
          id: 1,
          coordinates: [...INITIAL_CENTER],
          type: DEFAULT_MARKER_TYPE,
          color: DEFAULT_MARKER_COLOR,
          title: '',
          description: '',
        },
      ],
      editingMarkerId: null,
      markerTypes: MARKER_TYPES,
      markerColors: MARKER_COLORS,
      lines: [],
      selectedLineId: null,
      lineTypes: LINE_TYPES,
      lineColors: LINE_COLORS,
      rulerPoints: [],
      nextId: 2,
      suppressClick: false,
      clickGuardTimer: null,
      settings: {
        location: {
          center: INITIAL_CENTER,
          zoom: 15,
        },
      },
      draftStyle: {
        stroke: [{ width: 4, color: '#2b7de9', dash: [8, 8] }],
      },
      satelliteSettings: {
        zIndex: 1000,
      },
      featuresLayerSettings: {
        zIndex: 1500,
      },
    }
  },

  computed: {
    isMarkerMode() {
      return this.mode === MODE_MARKER
    },

    isLineMode() {
      return this.mode === MODE_LINE
    },

    isRulerMode() {
      return this.mode === MODE_RULER
    },

    isSchemeMap() {
      return this.mapType === MAP_TYPE_SCHEME
    },

    isSatelliteMap() {
      return this.mapType === MAP_TYPE_SATELLITE
    },

    isHybridMap() {
      return this.mapType === MAP_TYPE_HYBRID
    },

    selectedMarker() {
      return (
        this.markers.find((marker) => marker.id === this.editingMarkerId) ||
        null
      )
    },

    selectedLine() {
      return (
        this.lines.find((line) => line.id === this.selectedLineId) || null
      )
    },

    canFinish() {
      return this.rulerPoints.length >= 2
    },

    rulerSegments() {
      const segments = []
      for (let index = 0; index < this.rulerPoints.length - 1; index += 1) {
        const from = this.rulerPoints[index]
        const to = this.rulerPoints[index + 1]
        segments.push({
          id: index,
          distance: haversineDistance(from, to),
          midpoint: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
        })
      }
      return segments
    },

    rulerTotal() {
      return this.rulerSegments.reduce(
        (total, segment) => total + segment.distance,
        0
      )
    },

    rulerTotalLabel() {
      return formatDistance(this.rulerTotal)
    },

    hint() {
      if (this.isRulerMode) {
        if (this.rulerPoints.length === 0) {
          return 'Кликайте по карте, чтобы измерить расстояние'
        }
        return `Точек: ${this.rulerPoints.length}. Длина: ${this.rulerTotalLabel}. Кликните следующую точку`
      }
      if (!this.isLineMode) {
        return 'Кликните по карте, чтобы добавить метку, или выберите метку или линию'
      }
      if (this.rulerPoints.length === 0) {
        return 'Кликайте по карте, чтобы добавить точки линии'
      }
      if (!this.canFinish) {
        return `Точек: ${this.rulerPoints.length}. Добавьте ещё одну`
      }
      return `Точек: ${this.rulerPoints.length}. Нажмите «Завершить», чтобы сохранить линию`
    },

    listenerSettings() {
      return {
        layer: 'any',
        onClick: this.handleMapClick,
      }
    },
  },

  methods: {
    handleMapClick(object, event) {
      if (this.suppressClick) {
        return
      }

      const coordinates = [event.coordinates[0], event.coordinates[1]]

      if (this.isRulerMode || this.isLineMode) {
        this.rulerPoints = [...this.rulerPoints, coordinates]
        return
      }

      const line = this.findLineNear(coordinates)
      if (line) {
        this.selectLine(line.id)
        return
      }

      const marker = this.createMarker(coordinates)
      this.markers = [...this.markers, marker]
      this.selectedLineId = null
      this.editingMarkerId = marker.id
    },

    findLineNear(coordinates) {
      const tolerance = this.clickTolerance()
      let nearest = null
      let nearestDistance = Infinity

      for (const line of this.lines) {
        for (let index = 0; index < line.coordinates.length - 1; index += 1) {
          const distance = distanceToSegment(
            coordinates,
            line.coordinates[index],
            line.coordinates[index + 1]
          )
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearest = line
          }
        }
      }

      return nearestDistance <= tolerance ? nearest : null
    },

    clickTolerance() {
      const zoom = this.map ? this.map.zoom : 15
      const latitude = this.map ? this.map.center[1] : 0
      const metersPerPixel =
        (156543.03392 * Math.cos((latitude * Math.PI) / 180)) /
        Math.pow(2, zoom)
      return metersPerPixel * 12
    },

    selectLine(id) {
      this.selectedLineId = id
      this.editingMarkerId = null
    },

    closeLineMenu() {
      this.selectedLineId = null
    },

    deleteSelectedLine() {
      if (this.selectedLineId === null) {
        return
      }
      this.lines = this.lines.filter(
        (line) => line.id !== this.selectedLineId
      )
      this.selectedLineId = null
    },

    createMarker(coordinates) {
      return {
        id: this.nextId++,
        coordinates,
        type: DEFAULT_MARKER_TYPE,
        color: DEFAULT_MARKER_COLOR,
        title: '',
        description: '',
      }
    },

    createLine(coordinates) {
      return {
        id: this.nextId++,
        coordinates: coordinates.map((point) => [...point]),
        title: '',
        color: DEFAULT_LINE_COLOR,
        width: DEFAULT_LINE_WIDTH,
        lineType: DEFAULT_LINE_TYPE,
      }
    },

    lineDash(typeId) {
      const type = LINE_TYPES.find((item) => item.id === typeId)
      return type ? type.dash : []
    },

    lineStyle(line) {
      const stroke = { width: line.width, color: line.color }
      const dash = this.lineDash(line.lineType)
      if (dash.length > 0) {
        stroke.dash = dash
      }
      return { stroke: [stroke] }
    },

    lineFeatureSettings(line) {
      return {
        id: 'line-' + line.id,
        properties: { lineId: line.id },
        zIndex: 1500,
        geometry: {
          type: 'LineString',
          coordinates: line.coordinates,
        },
        style: this.lineStyle(line),
      }
    },

    lineHaloSettings(line) {
      return {
        id: 'line-halo-' + line.id,
        zIndex: 1490,
        geometry: {
          type: 'LineString',
          coordinates: line.coordinates,
        },
        style: {
          stroke: [{ width: line.width + 8, color: 'rgba(43, 125, 233, 0.35)' }],
        },
      }
    },

    handleRulerPointClick() {
      // Клик по уже добавленной точке не должен создавать новую точку или метку.
      this.handleSuppressClick()
    },

    setMap(instance) {
      this.map = instance ? markRaw(instance) : null
    },

    setMode(nextMode) {
      if (this.isLineMode && nextMode !== MODE_LINE) {
        this.finishLine()
      }
      this.mode = nextMode
      if (nextMode === MODE_LINE) {
        this.editingMarkerId = null
        this.selectedLineId = null
      }
    },

    finishLine() {
      if (this.canFinish) {
        const line = this.createLine(this.rulerPoints)
        this.lines = [...this.lines, line]
        this.rulerPoints = []
        this.mode = MODE_MARKER
        this.selectLine(line.id)
        return
      }
      this.rulerPoints = []
    },

    handleMarkerDragEnd(markerId, coordinates) {
      this.markers = this.markers.map((marker) =>
        marker.id === markerId ? { ...marker, coordinates } : marker
      )
    },

    handleMarkerClick(id) {
      this.editingMarkerId = id
    },

    handleRulerPointDrag(index, coordinates) {
      this.rulerPoints = this.rulerPoints.map((point, pointIndex) =>
        pointIndex === index ? coordinates : point
      )
    },

    handleSuppressClick(value) {
      if (value !== undefined) {
        this.suppressClick = value
      } else {
        this.suppressClick = true
        window.clearTimeout(this.clickGuardTimer)
        this.clickGuardTimer = window.setTimeout(() => {
          this.suppressClick = false
        }, 300)
      }
    },

    deleteSelectedMarker() {
      if (this.editingMarkerId === null) {
        return
      }
      this.markers = this.markers.filter(
        (marker) => marker.id !== this.editingMarkerId
      )
      this.editingMarkerId = null
    },

    activateMarkers() {
      this.setMode(MODE_MARKER)
    },

    activateLine() {
      this.setMode(MODE_LINE)
    },

    activateRuler() {
      this.setMode(MODE_RULER)
    },

    setMapType(type) {
      this.mapType = type
    },
  },

  beforeUnmount() {
    window.clearTimeout(this.clickGuardTimer)
  },
}
</script>

<template>
  <div class="map-shell">
    <div class="top-bar">
      <div class="top-bar__left">
        <Toolbar :is-marker-mode="isMarkerMode" :is-line-mode="isLineMode" :is-ruler-mode="isRulerMode"
          :draft-length="rulerPoints.length" :hint="hint" :selected-marker="selectedMarker"
          :selected-line="selectedLine" @activate-markers="activateMarkers" @activate-line="activateLine"
          @activate-ruler="activateRuler" @undo-point="() => rulerPoints = rulerPoints.slice(0, -1)"
          @finish-line="finishLine" />

        <MarkerMenu v-if="selectedMarker" :selected-marker="selectedMarker" :marker-types="markerTypes"
          :marker-colors="markerColors" @close="editingMarkerId = null"
          @update:type="(type) => selectedMarker.type = type" @update:color="(color) => selectedMarker.color = color"
          @update:title="(title) => selectedMarker.title = title"
          @update:description="(description) => selectedMarker.description = description"
          @delete="deleteSelectedMarker" />

        <div v-else-if="selectedLine" class="line-menu" aria-label="Настройки линии">
          <div class="marker-menu__header">
            <strong>Линия</strong>
            <button type="button" class="marker-menu__close" aria-label="Закрыть" @click="closeLineMenu">
              ×
            </button>
          </div>

          <label class="field">
            <span>Название</span>
            <input v-model="selectedLine.title" type="text" maxlength="80" placeholder="Например, маршрут прогулки" />
          </label>

          <div class="field">
            <span>Цвет</span>
            <div class="colors">
              <button v-for="color in lineColors" :key="color" type="button" class="color"
                :class="{ active: selectedLine.color === color }" :style="{ background: color }" :aria-label="color"
                :aria-pressed="selectedLine.color === color" @click="selectedLine.color = color"></button>
            </div>
          </div>

          <label class="field">
            <span>Толщина: {{ selectedLine.width }} px</span>
            <input v-model.number="selectedLine.width" type="range" min="1" max="12" step="1" />
          </label>

          <label class="field">
            <span>Тип линии</span>
            <select v-model="selectedLine.lineType">
              <option v-for="type in lineTypes" :key="type.id" :value="type.id">
                {{ type.label }}
              </option>
            </select>
          </label>

          <button type="button" class="delete-marker" @click="deleteSelectedLine">
            Удалить линию
          </button>
        </div>
      </div>

      <MapLayerSelector :is-scheme-map="isSchemeMap" :is-satellite-map="isSatelliteMap" :is-hybrid-map="isHybridMap"
        @set-scheme="() => mapType = 'scheme'" @set-satellite="() => mapType = 'satellite'"
        @set-hybrid="() => mapType = 'hybrid'" />
    </div>

    <YandexMap :model-value="map" :settings="settings" width="100%" height="100svh" cursor-grab
      @update:model-value="setMap">
      <YandexMapDefaultSchemeLayer v-if="isSchemeMap" />
      <YandexMapDefaultSatelliteLayer v-if="isSatelliteMap || isHybridMap" :settings="satelliteSettings" />
      <YandexMapHybridLabelsLayer v-if="isHybridMap" />
      <YandexMapDefaultFeaturesLayer :settings="featuresLayerSettings" />
      <YandexMapListener :settings="listenerSettings" />

      <!-- Существующие линии -->
      <YandexMapFeature v-if="selectedLine" :key="'halo-' + selectedLine.id"
        :settings="lineHaloSettings(selectedLine)" />

      <YandexMapFeature v-for="line in lines" :key="line.id" :settings="lineFeatureSettings(line)" />

      <!-- Линейка -->
      <LineRuler :ruler-points="rulerPoints" :ruler-segments="rulerSegments" :ruler-total="rulerTotal"
        :ruler-total-label="rulerTotalLabel" :is-ruler-mode="isRulerMode" :draft="rulerPoints" :draft-style="draftStyle"
        :suppress-click="suppressClick" @ruler-point-click="handleRulerPointClick"
        @ruler-point-drag="handleRulerPointDrag" @suppress-click="handleSuppressClick" />

      <!-- Метки -->
      <Markers :markers="markers" :editing-marker-id="editingMarkerId" :selected-line-id="selectedLineId"
        :ruler-points="rulerPoints" :marker-types="markerTypes" :marker-colors="markerColors"
        :suppress-click="suppressClick" @edit-marker="(id) => editingMarkerId = id" @marker-click="handleMarkerClick"
        @marker-drag-end="handleMarkerDragEnd" @suppress-click="handleSuppressClick" />
    </YandexMap>
  </div>
</template>

<style scoped>
.map-shell {
  position: relative;
  height: 100svh;
}

.top-bar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 100;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
  text-align: left;
}

.top-bar__left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: min(380px, 100%);
}

/* Панель пропускает клики к карте, но её содержимое должно быть кликабельным. */
.top-bar>*,
.top-bar__left>* {
  pointer-events: auto;
}

.line-menu {
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
.field select {
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

.field input:focus,
.field select:focus {
  border-color: #2b7de9;
  outline: 2px solid rgba(43, 125, 233, 0.35);
  outline-offset: 1px;
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

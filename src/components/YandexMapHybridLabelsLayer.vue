<script>
import { inject, onBeforeUnmount, watch } from 'vue'

// Hybrid = satellite imagery + transparent raster tiles with labels and POIs.
// Both entities are managed by hand so the layer is always detached before
// its data source (the map forbids removing a source that is still in use).
const SOURCE_ID = 'hybrid-labels'

const LABELS_TILE_URL =
  'https://core-renderer-tiles.maps.yandex.net/tiles?l=skl&x={{x}}&y={{y}}&z={{z}}&scale={{scale}}&lang=ru_RU&apikey=' +
  import.meta.env.VITE_YANDEX_MAP_API

export default {
  name: 'YandexMapHybridLabelsLayer',

  props: {
    zIndex: {
      type: Number,
      default: 1100,
    },
  },

  setup(props) {
    const map = inject('map', null)

    let attachedMap = null
    let source = null
    let layer = null

    function attach(instance) {
      if (attachedMap || !instance) {
        return
      }

      source = new ymaps3.YMapTileDataSource({
        id: SOURCE_ID,
        clampMapZoom: true,
        copyrights: ['© Яндекс'],
        zoomRange: { min: 0, max: 19 },
        raster: {
          type: 'satellite',
          fetchTile: LABELS_TILE_URL,
        },
      })

      layer = new ymaps3.YMapLayer({
        source: SOURCE_ID,
        type: 'satellite',
        zIndex: props.zIndex,
      })

      instance.addChild(source)
      instance.addChild(layer)
      attachedMap = instance
    }

    const stop = watch(
      map,
      (instance) => {
        if (instance) {
          attach(instance)
        }
      },
      { immediate: true }
    )

    onBeforeUnmount(() => {
      stop()

      if (!attachedMap) {
        return
      }

      try {
        if (layer) {
          attachedMap.removeChild(layer)
        }
      } catch (error) {
        // the map may already be destroyed
      }

      try {
        if (source) {
          attachedMap.removeChild(source)
        }
      } catch (error) {
        // the map may already be destroyed
      }

      layer = null
      source = null
      attachedMap = null
    })

    return () => {}
  },
}
</script>

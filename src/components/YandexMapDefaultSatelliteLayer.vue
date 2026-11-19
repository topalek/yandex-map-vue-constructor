<script>
import { computed, inject, onMounted } from 'vue'
import { setupMapChildren } from 'vue-yandex-maps'

// YMapDefaultSatelliteLayer is available in the ymaps3 runtime, but
// vue-yandex-maps 3.x does not ship a component for it yet.
export default {
  name: 'YandexMapDefaultSatelliteLayer',

  props: {
    modelValue: {
      type: Object,
      default: null,
    },
    settings: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const hold = inject('needsToHold')
    hold.value++

    let mapLayer

    onMounted(async () => {
      mapLayer = await setupMapChildren({
        createFunction: () =>
          new ymaps3.YMapDefaultSatelliteLayer(props.settings || {}),
        settings: computed(() => props.settings),
        isLayer: true,
      })
      emit('update:modelValue', mapLayer)
      hold.value--
    })

    return () => {}
  },
}
</script>

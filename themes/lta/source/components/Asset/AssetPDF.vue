<template>
  <Asset v-editable="$props" class="asset-pdf">
    <div
      ref="pdfContainer"
      v-show="initialized"
      :id="id"
      class="pdf-container"
      :class="{
        'pdf-container-inline': displayPDFInline
      }"
    />
  </Asset>
</template>

<script setup>
const props = defineProps({
  asset: {
    type: Object,
    required: true
  },
  displayPDFInline: Boolean,
  _editable: String
})

const { public: { adobe: { pdfEmbedApiKey } } } = useRuntimeConfig()
const img = useImage()

const initialized = ref(false)

const id = computed(() => `asset-${props.asset?.id}`)

/**
 * Proxy Storyblok asset URL through Cloudinary to avoid CORS errors
 *
 * - Input: https://a.storyblok.com/f/120093/x/b96c1ec8c3/great-lakes-water-report-lta-exec-summary.pdf
 * - Output: https://res.cloudinary.com/land-trust-alliance/image/fetch/f_pdf/https://a.storyblok.com/f/120093/x/b96c1ec8c3/great-lakes-water-report-lta-exec-summary.pdf
 */
const pdfFilenameProxied = computed(() => {
  return props.asset?.filename?.includes('.pdf')
    ? img(props.asset.filename, { format: 'pdf' })
    : undefined
})

const pdfTitle = computed(() => {
  // If there is no Title set in Storyblok, this will get the pdf filename instead
  return props.asset?.title
    ? props.asset.title
    : props.asset.filename?.match('[^/]+$')
})

const pdfEmbedMode = computed(() => {
  return props.displayPDFInline ? 'IN_LINE' : undefined
})

useScript('https://documentservices.adobe.com/view-sdk/viewer.js')

function initializeAdobeDCView() {
  try {
    const adobeDCView = new window.AdobeDC.View({
      clientId: pdfEmbedApiKey,
      divId: id.value
    })

    initialized.value = true

    adobeDCView.previewFile(
      {
        content: { location: { url: pdfFilenameProxied.value } },
        metaData: { fileName: pdfTitle.value }
      },
      {
        showAnnotationTools: false, // disables comments & annotations
        enableFormFilling: false,
        embedMode: pdfEmbedMode.value
      }
    )
  } catch (err) {
    console.error('Error initializing Adobe PDF Embed API:', err.message)
  }
}

onMounted(() => {
  if (window.AdobeDC) {
    initializeAdobeDCView()
  } else {
    document.addEventListener(
      'adobe_dc_view_sdk.ready',
      initializeAdobeDCView
    )
  }
})
</script>

<style lang="postcss" scoped>
.asset-pdf {
}

.pdf-container {
  height: 80vh;
  min-height: 600px;
  max-height: 800px;

  &-inline {
    height: auto;
    min-height: auto;
    max-height: none;

    :deep(iframe) {
      min-height: 600px;
    }
  }
}
</style>

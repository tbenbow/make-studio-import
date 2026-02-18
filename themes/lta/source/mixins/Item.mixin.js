import { documentIsValid } from '@/components/RichText'

export const types = {
  CARD: 'card',
  CARD_HORIZONTAL: 'card-horizontal',
  HORIZONTAL: 'horizontal',
  IMAGE: 'image',
  INLINE: 'inline'
}
const orientations = ['horizontal']
const alignments = ['left', 'center', 'right']
const sizes = ['small', 'large']
const iconStyles = ['circle', 'underline']
const iconSizes = ['xsmall', 'small', 'default', 'large'] // `xsmall` is deprecated
const titleSizes = ['small', 'default', 'large']
const bodySizes = ['xsmall', 'small', 'default', 'large']

function componentForType(type) {
  switch (type) {
    case 'card':
    case 'card-horizontal':
      return 'ItemCard'

    case 'image':
      return 'ItemImage'

    case 'inline':
      return 'ItemInline'

    case 'horizontal':
    default:
      return 'ItemBase'
  }
}

export default {
  props: {
    icon: String,
    image: [Object, String],
    imageOptions: Object,
    label: String,
    title: String,
    subtitle: String,
    body: [Object, String],
    link: [Object, String],
    type: {
      type: String,
      validator: (value) => !value || Object.values(types).includes(value)
    },
    orientation: {
      type: String,
      validator: (value) => !value || orientations.includes(value)
    },
    align: {
      type: String,
      validator: (value) => !value || alignments.includes(value)
    },
    accentColor: String,
    size: {
      type: String,
      validator: (value) => !value || sizes.includes(value)
    },
    iconStyle: {
      type: String,
      validator: (value) => !value || iconStyles.includes(value)
    },
    iconSize: {
      type: String,
      validator: (value) => !value || iconSizes.includes(value)
    },
    titleSize: {
      type: String,
      validator: (value) => !value || titleSizes.includes(value)
    },
    bodySize: {
      type: String,
      validator: (value) => !value || bodySizes.includes(value)
    },
    showLoader: Boolean,
    showLoaderError: Boolean,
    showPlaceholder: Boolean,
    disabled: Boolean,
    _editable: String
  },
  computed: {
    componentForType() {
      return componentForType(this.type)
    },
    computedProps() {
      return lodash.merge({}, this.filteredProps, this.typeProps)
    },
    /**
     * Filter props that only have a value. Certain fields types like images
     * and links will still return an object, so those need a closer look to
     * determine if they have a value or not.
     * @returns {object} - The filtered props
     */
    filteredProps() {
      return Object.entries(this.$props)
        .filter(([prop, value]) => {
          switch (prop) {
            case 'image':
              return typeof value === 'object' && value.filename

            case 'link':
              const { isValid } = useLinkHelper(value)
              return isValid.value

            default:
              return !!value
          }
        })
        .reduce((obj, [prop, value]) => ({ ...obj, [prop]: value }), {})
    },
    /**
     * The `type` prop is like a preset. Set particular props for types here.
     * @returns {object} - Props for the type
     */
    typeProps() {
      switch (this.type) {
        case 'card-horizontal':
        case 'horizontal':
          return {
            orientation: 'horizontal'
          }

        default:
          return {}
      }
    },
    defaultImageOptions() {
      return {}
    },
    computedImageOptions() {
      return lodash.merge(
        {},
        this.defaultImageOptions,
        this.imageOptions || {}
      )
    },
    titleTag() {
      const globalFactor =
        this.size === 'small' ? 1 : this.size === 'large' ? -1 : 0

      switch (this.titleSize) {
        case 'small':
          return `h${5 + globalFactor}`

        case 'large':
          return `h${3 + globalFactor}`

        case 'default':
          return 'h4'

        default:
          return `h${4 + globalFactor}`
      }
    },
    hasIcon() {
      return !!this.icon
    },
    defaultIconSize() {
      return this.size
    },
    hasImage() {
      return !!(typeof this.image === 'object' && this.image.filename)
    },
    hasBody() {
      return (
        documentIsValid(this.body) ||
        this.$slots.default ||
        this.$slots['before-body'] ||
        this.$slots['after-body']
      )
    },
    defaultBodySize() {
      return this.size
    },
    hasLink() {
      const { isValid } = useLinkHelper(this.link)

      return isValid.value
    }
  }
}

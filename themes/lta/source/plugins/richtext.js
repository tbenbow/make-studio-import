import AssetImage from '@/components/Asset/AssetImage.vue'
import AssetVideo from '@/components/Asset/AssetVideo.vue'
import Banner from '@/components/Banner.vue'
import Button from '~/components/global/ButtonComponent.vue'
import Callout from '@/components/Callout.vue'
import Divider from '~/components/global/Divider.vue'
import Embed from '@/components/Embed/Embed.vue'
import Expandable from '@/components/Expandable/Expandable.vue'
import ExpandableList from '@/components/Expandable/ExpandableList.vue'
import Footing from '@/components/Footing.vue'
import Form from '@/components/global/Form/Form.vue'
import Gallery from '@/components/Gallery.vue'
import GlossaryTermItem from '@/components/Glossary/GlossaryTermItem'
import Heading from '@/components/Heading/Heading.vue'
import Item from '~/components/global/Item/Item.vue'
import ItemList from '~/components/global/Item/ItemList.vue'
import LayoutGrid from '@/components/LayoutGrid.vue'
import List from '@/components/List/List.vue'
import Menu from '@/components/Menu/Menu.vue'
import Quote from '@/components/Quote.vue'
import SearchLandTrusts from '~/components/global/SearchLandTrusts.vue'
import SearchResources from '~/components/global/SearchResources.vue'
import SelectGainingGround from '~/components/global/SelectGainingGround.vue'
import Slider from '@/components/Slider.vue'
import StoryMap from '@/components/StoryMap.vue'
import Table from '@/components/Table/Table.vue'

import { plugin, defaultResolvers } from '@/mixins/storyblok-rich-text-renderer'

const resolvers = {
  ...defaultResolvers,
  components: {
    AssetImage,
    AssetVideo,
    Banner,
    Button,
    Callout,
    Divider,
    Embed,
    Expandable,
    ExpandableList,
    Footing,
    Form,
    Gallery,
    GlossaryTermItem,
    Heading,
    Item,
    ItemList,
    LayoutGrid,
    List,
    Menu,
    Quote,
    SearchLandTrusts,
    SearchResources,
    SelectGainingGround,
    Slider,
    StoryMap,
    Table
  }
}


export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(plugin({resolvers}))
})

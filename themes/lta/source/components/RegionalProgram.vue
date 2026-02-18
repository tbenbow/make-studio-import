<template>
  <div v-editable="$props" class="regional-program">
    <Blocks :root="true">
      <Banner
        label="Regional Program"
        :title="sys?.name"
        :body="descriptionAsRichText"
        :background-image="bannerImage"
        :land-trust="landTrust"
        size="small"
        align="center"
        order="0"
        :root="true"
      />
      <Breadcrumbs />
      <template v-if="alert && alert.length">
        <Alert v-for="(a, index) in alert" :key="index" v-bind="a" />
      </template>
      <Content
        v-if="introduction || (menu && menu.length)"
        class="main"
        :body="introduction"
        position="right"
      >
        <template #sidebar>
          <Menu
            v-if="menu && menu.length"
            v-bind="menu[0]"
            :panel="true"
          />
        </template>
      </Content>
      <Tabs :tabs="tabs" :active-tab-changes-url="true">
        <template #tab="{ index, id }">
          <div v-if="index === 0">
            <Blocks>
              <Heading
                v-if="aboutContent || (staff && staff.length)"
                :title="aboutSectionHeader || 'About'"
                :description="aboutContent"
                description-size="default"
                width="large"
              />
              <ItemList
                v-if="staff && staff.length"
                :grid="true"
                grid-columns="2"
              >
                <ItemContact
                  v-for="(contact, i) in staff"
                  :key="i"
                  :source="contact"
                  type="horizontal"
                  body-size="small"
                />
              </ItemList>
              <LayoutSection
                v-if="statesGainingGround && statesGainingGround.length > 1"
                background-color="gray"
              >
                <HeadingSimple title="States We Serve" title-tag="h2" />
                <ItemList :grid="true" grid-columns="6">
                  <ItemGainingGround
                    v-for="(state, i) in statesGainingGround"
                    :key="i"
                    :source="state"
                  />
                </ItemList>
                <LogoGrid
                  v-if="memberGrid && memberGrid.length"
                  class="pt-12 border-t border-line"
                  title="State Association Members"
                  :logos="memberGrid"
                />
              </LayoutSection>
              <Blocks v-if="programList && programList.length">
                <template #before>
                  <Heading :title="programListHeader || 'Regional Programs'" />
                </template>
                <ItemList
                  :items="programList"
                  :grid="true"
                  grid-columns="3"
                  :source-item-template="{ size: 'small' }"
                />
              </Blocks>
              <template v-if="faqs && faqs.length">
                <Divider />
                <Blocks :blocks="faqs">
                  <template #before>
                    <Heading title="FAQs" title-tag="h3" />
                  </template>
                </Blocks>
              </template>
            </Blocks>
          </div>

          <Blocks v-else-if="index === 1">
            <Heading title="Regional News & Events" />
            <ItemList
              v-if="region"
              :show-dividers="true"
              :show-source-pagination="true"
              :source="['PressMention']"
              source-sort-by="first_published_at"
              source-sort-direction="desc"
              :source-limit="8"
              :source-press-mention-regions="[region]"
              :source-item-template="{
                type: 'inline'
              }"
            />
            <Callout
              icon="newspaper"
              title="Submit Your News"
              button-link="/resources/connect/submit-your-news"
              button-name="Submit Your News"
            >
              <p>
                Has your land trust recently been featured in the news? Share it
                with us so we can feature your great work!
              </p>
            </Callout>
            <Blocks>
              <Heading title="Alliance News" />
              <ItemList
                :show-dividers="true"
                :source="['PressRelease']"
                source-sort-by="first_published_at"
                source-sort-direction="desc"
                :source-limit="4"
                :source-item-template="{
                  type: 'inline'
                }"
              >
                <template #footer>
                  <RichText>
                    <ButtonComponent name="More Press Releases" icon="arrow-right" />
                  </RichText>
                </template>
              </ItemList>
            </Blocks>
          </Blocks>

          <Blocks v-else-if="index === 2">
            <Heading
              v-if="impactContent"
              :title="impactSectionHeader || 'Our Impact'"
              :description="impactContent"
              description-size="default"
              width="large"
            />
            <template v-if="impactProjects && impactProjects.length">
              <Divider />
              <Heading :title="impactProjectsHeader || 'Impact Projects'" />
              <ItemList
                :items="impactProjects"
                :grid="true"
                grid-columns="3"
                :source-item-template="{ size: 'small' }"
              />
            </template>
            <Blocks
              v-if="impactAdditionalContent && impactAdditionalContent.length"
              :blocks="impactAdditionalContent"
            />
          </Blocks>

          <Blocks v-else-if="id === 'resources'">
            <AlgoliaResources
              :title="`Resources for ${region}`"
              :regions="regions"
              :display-filters="[
                'topics',
                'type',
                'expertise',
                'regions',
                'tags',
                'internal',
                'priceMemberFree'
              ]"
              :disable-history="true"
            />
          </Blocks>
        </template>
      </Tabs>
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { RegionalProgramProps } from '~/composables/content-types/useRegionalProgram'

const props = defineProps<RegionalProgramProps>()

const {
  descriptionAsRichText,
  statesGainingGround,
  fetchStatesGainingGround
} = useRegionalProgram(props)

const regions = computed(() => props.region ? [props.region] : undefined)

const hasResourcesTab = computed(() => !!props.region)

const tabs = computed(() => {
  const tabs: any[] = [
    { title: 'About' },
    { title: 'News & Events' },
    { title: 'Our Impact' }
  ]

  if (hasResourcesTab.value) {
    tabs.push({ title: 'Resources', id: 'resources' })
  }

  return tabs
})

onMounted(async () => {
  await fetchStatesGainingGround()
})
</script>

<style lang="postcss" scoped>
.regional-program {
}

.main {
  :deep(.alert + &) {
    @apply mt-12;
  }
}
</style>

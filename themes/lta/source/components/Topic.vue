<template>
  <div v-editable="$props" class="topic">
    <Blocks :root="true">
      <Banner
        label="Topic"
        :title="sys?.name"
        :background-image="bannerImage"
        :body="bannerBody"
        :land-trust="landTrust"
        :root="true"
        order="0"
      />
      <Breadcrumbs />
      <template v-if="alert && alert.length">
        <Alert v-for="(a, index) in alert" :key="index" v-bind="a" />
      </template>
      <Content
        v-if="introduction || parent || sys"
        class="main"
        :body="introduction"
        position="right"
      >
        <template #sidebar>
          <Menu
            v-if="parent || sys?.is_startpage"
            :title="parent && typeof parent === 'object' ? parent.name : sys?.name"
            :root="parent || sys"
            :panel="true"
          />
        </template>
      </Content>
      <template v-if="content && content.length">
        <component
          v-for="(block, index) in content"
          :key="index"
          :is="resolveAsyncComponent(block.component)"
          :root="true"
          v-bind="block"
        />
      </template>
      <LayoutSection background-color="white" top-edge="shadow-top">
        <AlgoliaResources
          :title="`Resources for ${sys?.name}`"
          :topic="{ name: sys?.name, content: { parent: parent } }"
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
      </LayoutSection>
      <Banner
        v-if="featuredSubTopic && typeof featuredSubTopic === 'object' && featuredSubTopic.content"
        label="Featured Sub-Topic"
        :title="featuredSubTopic.name"
        :background-image="featuredSubTopic.content.bannerImage"
        :body="featuredSubTopic.content.bannerBody"
        :root="true"
      >
        <template #after-body>
          <div class="pt-6">
            <ButtonComponent
              :name="featuredSubTopic.name"
              :link="`/${featuredSubTopic.full_slug}`"
              icon="arrow-right"
            />
          </div>
        </template>
      </Banner>
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { TopicProps } from '~/composables/content-types/useTopic'

defineProps<TopicProps>()
</script>

<style lang="postcss" scoped>
.topic {
}

.main {
  :deep(.alert) + & {
    @apply mt-12;
  }
}
</style>

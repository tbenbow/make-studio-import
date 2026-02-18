<template>
  <div class="glossary">
    <Blocks :root="true">
      <Heading :title="title" title-tag="h1" />
      <div>
        <GlossaryNavigation
          v-if="showNavigation && groupByLetter"
          :links="arrangedByLetter"
        />
        <div v-if="groupByLetter || showNavigation" class="term-groups">
          <div
            v-for="(letterGroup, index) in arrangedByLetter"
            :key="index"
            class="term-group"
          >
            <div :id="letterGroup.letter" class="term-group-title">
              {{ letterGroup.letter }}
            </div>
            <dl
              v-for="(glossaryTerm, termIndex) in letterGroup.glossaryTerms"
              :key="termIndex"
              class="term-list"
            >
              <dt class="sr-only">
                {{ glossaryTerm.term }}
              </dt>
              <GlossaryTerm v-bind="glossaryTerm" tag="dd" />
            </dl>
          </div>
        </div>
        <dl v-else class="term-list">
          <template v-for="(item, termIndex) in glossaryTerms" :key="termIndex" >
            <dt class="sr-only">
              {{ item.content.term }}
            </dt>
            <GlossaryTerm v-bind="item.content" tag="dd" />
          </template>
        </dl>
      </div>
    </Blocks>
  </div>
</template>

<script>
export default {
  props: {
    showNavigation: Boolean,
    groupByLetter: {
      type: Boolean,
      default: false
    },
    glossaryTerms: Array,
    sys: Object,
    _editable: String
  },
  computed: {
    title() {
      return this.sys?.name || 'Glossary'
    },
    arrangedByLetter() {
      const resultObj = {}
      const array = this.glossaryTerms
      for (let i = 0; i < array.length; i++) {
        const currentWord = array[i].content.term
        const firstChar = currentWord[0].toLowerCase()
        const innerArr = { letter: '', glossaryTerms: [] }
        if (resultObj[firstChar] === undefined) {
          innerArr.glossaryTerms.push({
            term: currentWord,
            definition: array[i].content.definition
          })
          innerArr.letter = firstChar
          resultObj[firstChar] = innerArr
        } else {
          resultObj[firstChar].glossaryTerms.push({
            term: currentWord,
            definition: array[i].content.definition
          })
        }
      }
      return resultObj
    }
  }
}
</script>

<style lang="postcss" scoped>
.glossary {
}

:deep(.glossary-navigation) {
  @apply mb-12;
}

.term-groups {
  @apply flex flex-col gap-12;

  > .term-group {
    @apply flex-1;
  }
}

.term-group {
  &-title {
    @apply uppercase text-blue text-2xl lg:text-3xl leading-[1.15] mb-4 font-bold font-serif;
  }
}

:deep(.glossary-term) {
  @apply py-4;
}
</style>

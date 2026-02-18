import { createApp, createVNode, render } from 'vue'
import { useMutationObserver } from '@vueuse/core'
import { defu } from 'defu'
import { cloneDeep } from 'lodash-es'
import Mark from 'mark.js'
import GlossaryTermMark from '@/components/Glossary/GlossaryTermMark.vue'
import { useGlossaryStore } from '@/stores/glossary'

class MarkGlossaryTerms {
  el
  context
  options
  markInstance
  isMarked = false

  constructor(el, opts, context) {
    this.el = el
    this.context = context

    const defaultOptions = {
      glossaryTerms: [],
      selectors: 'p'
    }

    this.options = Array.isArray(opts)
      ? Object.assign({}, defaultOptions, { glossaryTerms: cloneDeep(opts) })
      : Object.assign({}, defaultOptions, cloneDeep(opts))

    if (!this.options.glossaryTerms) {
      this.options.glossaryTerms = []
    }

    this.setInstance()
  }

  get searchWords() {
    return this.options.glossaryTerms?.map((glossaryTerm) => glossaryTerm.term)
  }

  get scopedSelectors() {
    return this.options.selectors
      .split(',')
      .map((selector) => `:scope ${selector.trim()}`)
      .join(', ')
  }

  setInstance() {
    this.markInstance = new Mark(this.el.querySelectorAll(this.scopedSelectors))
  }

  mark(doneCallback?: Function) {
    if (!this.searchWords.length) {
      return
    }

    if (this.isMarked) {
      return this.unmark(() => this.mark())
    }

    this.setInstance()

    this.markInstance.mark(this.searchWords, {
      element: 'glossary-term-mark',
      separateWordSearch: false,
      accuracy: {
        value: 'exactly',
        limiters: ',;.?!()[]{}\'"'.split('')
      },
      each: (mark) => {
        // Find the glossary term for the mark so we can get the UUID
        const glossaryTerm = this.options.glossaryTerms.find(
          (glossaryTerm) =>
            glossaryTerm.term.toUpperCase() === mark.innerText.toUpperCase()
        )

        // Create a new instance of the GlossaryTermMark component
        let vnode = createVNode(GlossaryTermMark, {
          objectId: glossaryTerm?.uuid,
          'data-markjs': '' // This is how mark.js identifies instances when running `unmark()`
        }, {
          default: () => mark.innerText
        })
        vnode.appContext = { ...this.context.appContext }
        
        const tempDiv = document.createElement('div')
        render(vnode, tempDiv)

        // Replace the mark with the component
        mark.replaceWith(...tempDiv.children)
      },
      done: () => {
        this.isMarked = true

        if (typeof doneCallback === 'function') {
          doneCallback()
        }
      }
    })
  }

  unmark(doneCallback?: Function) {
    this.markInstance.unmark({
      done: () => {
        this.isMarked = false

        if (typeof doneCallback === 'function') {
          doneCallback()
        }
      }
    })
  }
}

export interface MarkGlossaryProps {
  markGlossary?: string
}

export const useMarkGlossary = (props: MarkGlossaryProps) => {
  // @ts-expect-error Does not exist (store isn't TypeScript)
  const { getGlossaryTerms } = storeToRefs(useGlossaryStore())

  const observer = ref()

  const markGlossaryTerms = computed(() => getGlossaryTerms.value(props.markGlossary))
  
  function initialize(element: HTMLElement, context: any) {
    if (!markGlossaryTerms.value) {
      return
    }

    // Mark element
    const marker = new MarkGlossaryTerms(
      element,
      markGlossaryTerms.value,
      context
    )

    marker.mark()

    // Watch element for added nodes to mark
    observer.value = useMutationObserver(
      element,
      (mutations) => {
        mutations.forEach((mutation) => {
          switch (mutation.type) {
            case 'childList':
              mutation.addedNodes.forEach((node) => {
                if (
                  node.nodeType === Node.ELEMENT_NODE &&
                  node.tagName !== 'MARK'
                ) {
                  const marker = new MarkGlossaryTerms(
                    node,
                    markGlossaryTerms.value,
                    context
                  )

                  marker.mark()
                }
              })
              break
          }
        })
      },
      { subtree: true, childList: true }
    )
  }

  function destroy() {
    if (observer.value) {
      observer.value.stop()
    }
  }
  
  return {
    ...props,
    initialize,
    destroy
  }
}

import type { AccessProps } from '~/composables/useAccess'
import type { CollectionProps } from '~/composables/useCollection'
import type { CompletionProps } from '~/composables/useCompletion'
import type { MarkGlossaryProps } from '~/composables/useMarkGlossary'

export interface PageProps extends AccessProps, CollectionProps, CompletionProps, MarkGlossaryProps {
  blocks?: Record<string, any>[]
  meta?: Record<string, any> | string
  sys?: Record<string, any>
}

export const usePage = (props: PageProps) => {
  const { initialize: initializeMarkGlossary, destroy: destroyMarkGlossary } = useMarkGlossary({ markGlossary: props.markGlossary })

  return {
    ...props,
    initializeMarkGlossary,
    destroyMarkGlossary
  }
}

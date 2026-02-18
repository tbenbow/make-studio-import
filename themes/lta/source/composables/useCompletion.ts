export interface CompletionProps {
  completion?: boolean
}

export const useCompletion = (props: CompletionProps) => {
  return {
    ...props
  }
}

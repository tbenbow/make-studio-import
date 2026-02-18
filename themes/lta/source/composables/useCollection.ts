export interface CollectionProps {
  collection?: Record<string, any>[]
}

export const useCollection = (props: CollectionProps) => {
  return {
    ...props
  }
}

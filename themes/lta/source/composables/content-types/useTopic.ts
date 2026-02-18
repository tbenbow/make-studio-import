export interface TopicProps {
  parent?: Record<string, any> | string
  alert?: Record<string, any>[]
  bannerImage?: Record<string, any>
  bannerBody?: Record<string, any> | string
  introduction?: Record<string, any> | string
  featuredSubTopic?: Record<string, any> | string
  content?: Record<string, any> | string[]
  landTrust?: Record<string, any>
  meta?: Record<string, any> | string
  sys?: Record<string, any>
}

export const useTopic = (props: TopicProps) => {
  return {
    ...props
  }
}

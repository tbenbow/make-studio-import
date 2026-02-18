export const useRails = () => {
  const { rails: { baseUrl } } = useRuntimeConfig()

  /**
   * Simple wrapper around $fetch that includes the Rails base URL.
   */
  function $fetchRails(path: string, options: any = {}) {
    return $fetch(`${baseUrl}${path}`, options)
  }

  return {
    $fetchRails
  }
}

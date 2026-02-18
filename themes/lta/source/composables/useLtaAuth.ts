export const useLtaAuth = () => {
  const { status, data, signIn, signOut } = useAuth()

  const loggedIn = computed(() => status.value === 'authenticated')
  
  const user = computed(() => data.value?.user)

  return {
    loggedIn,
    user,
    signIn,
    signOut
  }
}

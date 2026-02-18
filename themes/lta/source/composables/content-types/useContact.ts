import { parsePhoneNumberWithError } from 'libphonenumber-js'

export interface ContactProps {
  title?: string
  phone?: string
  email?: string
  image?: Record<string, any>
  sys?: Record<string, any>
}

export const useContact = (props: ContactProps) => {
  const phoneLink = computed(() => {
    if (props.phone) {
      try {
        return parsePhoneNumberWithError(props.phone, 'US').getURI()
      } catch (err) {}
    }
  })

  return {
    ...props,
    phoneLink
  }
}

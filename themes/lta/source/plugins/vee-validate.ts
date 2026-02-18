import { configure, defineRule } from 'vee-validate'
import { email, min, max, required } from '@vee-validate/rules'

export default defineNuxtPlugin(() => {
  configure({
    validateOnChange: true,
    validateOnBlur: true,
    validateOnInput: false,
    validateOnModelUpdate: true,
    generateMessage: ({ rule, field }) => {
      switch (rule?.name) {
        case 'email':
          return 'Field must be a valid email address.'
        
        case 'min':
          return `Field must have at least ${Array.isArray(rule?.params) ? rule?.params[0] : '[unknown]'} characters.`
        
        case 'max':
          return `Field must have at most ${Array.isArray(rule?.params) ? rule?.params[0] : '[unknown]'} characters.`
        
        case 'required':
          return 'Field is required.'
        
        default:
          return 'Field is not valid.'
      }
    }
  })

  defineRule('email', email)
  defineRule('min', min)
  defineRule('max', max)
  defineRule('required', required)
})

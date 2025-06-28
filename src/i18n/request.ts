import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ requestLocale }) => {
  // This function is called for each request
  let locale = await requestLocale

  // Ensure that the incoming `locale` is valid
  if (!locale || !['en', 'th'].includes(locale)) {
    locale = 'th'
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
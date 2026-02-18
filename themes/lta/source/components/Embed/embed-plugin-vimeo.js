import extend from "just-extend"
import base from "embed-plugin-base"

const id = "vimeo"

export default function vimeo(opts) {
  const defaultOptions = {
    id,
    regex: /.+?(?=vimeo.com).*/gi,
    template(args, options, { height = 300, urlParams }) {
      const url = args[0]
      const match = url.match(/vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/i)
      const videoId = match?.[1]
      const unlistedHash = match?.[2]
      const params = new URLSearchParams(urlParams)
      if (unlistedHash) {
        params.set('h', unlistedHash)
      }
      const queryString = params.toString()
      const embedUrl = `https://player.vimeo.com/video/${videoId}${queryString ? `?${queryString}` : ''}`
      
      return `<iframe class="ejs-embed ejs-${id}" src="${embedUrl}" frameBorder="0" height="${height}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    }
  }

  const pluginOptions = extend({}, defaultOptions, opts)
  return base(pluginOptions)
}

vimeo.id = id

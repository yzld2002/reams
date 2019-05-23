const RNFS = require('react-native-fs')
const sanitizeHtml = require('sanitize-html')
import {Dimensions} from 'react-native'
import {createItemStyles, compressStyles, expandStyles} from './createItemStyles'
import {getCachedImagePath} from './index'
import log from './log'
import LZString from 'lz-string'

export function addStylesIfNecessary (item, index, items) {
  if (item.styles && !item.styles.temporary) {
    return item
  } else {
    const prevStyles = index > 0 ? items[index-1].styles : null
    let styles = createItemStyles(item, prevStyles)
    if (item.title === 'Loading...') {
      styles.temporary = true
    }
    return {
      ...item,
      styles
    }
  }
}

export function deflateItem (item) {
  if (!item) {
    log('Item is null?')
  }
  const styles = item.styles
  // const compressed = LZString.compressToUTF16(JSON.stringify(compressStyles(item.styles)))
  return {
    _id: item._id,
    banner_image: item.banner_image, // needed by the feed component
    content_length: item.content_length || (item.content_html
      ? item.content_html.length
      : 0),
    created_at: item.created_at,
    feed_id: item.feed_id,
    feed_color: item.feed_color,
    hasCoverImage: item.hasCoverImage,
    imageDimensions: item.imageDimensions,
    hasLoadedMercuryStuff: item.hasLoadedMercuryStuff,
    id: item.id, // needed to match existing copy in store
    readAt: item.readAt,
    title: item.title,
    url: item.url,
    isSaved: item.isSaved
  }
}

export function inflateItem (item) {
  const styles = item.styles
  if (typeof styles === 'object') return item
  const expanded = expandStyles(JSON.parse(LZString.decompressFromUTF16(styles)))
  return {
    ...item,
    styles: expanded
  }
}

export function isInflated (item) {
  return Object.keys(item).indexOf('content_html') !== -1
}

export function fixRelativePaths (item) {
  if (!item.url) return item
  const matches = /http[s]?:\/\/[^:\/\s]+/.exec(item.url)
  if (!matches) return item
  const host = matches[0]
  const derelativise = s => s.replace(/src="\//g, `src="${host}/`)
  if (item.content_html) item.content_html = derelativise(item.content_html)
  if (item.content_mercury) item.content_mercury = derelativise(item.content_mercury)
  if (item.body) item.body = derelativise(item.body)
  return item
}

export function sanitizeContent (item) {
  const settings = {
    allowedTags: false,
    allowedAttributes: false
  }
  if (item.content_html) item.content_html = sanitizeHtml(item.content_html, settings)
  if (item.content_mercury) item.content_mercury = sanitizeHtml(item.content_mercury, settings)
  return item
}

export function nullValuesToEmptyStrings (item) {
  item.title = item.title ? item.title : ''
  item.content_html = item.content_html ? item.content_html : ''
  return item
}

export function addMercuryStuffToItem (item, mercury) {
  mercury.content = sanitizeHtml(mercury.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ])
  })
  if (item.is_external) {
    return {
      ...item,
      external_url: item.url,
      title: mercury.title,
      content_mercury: mercury.content ? mercury.content : '',
      body: mercury.content ? mercury.content : '',
      date_published: mercury.date_published,
      date_modified: mercury.date_published,
      author: mercury.author,
      feed_title: mercury.domain,
      banner_image: mercury.lead_image_url,
      excerpt: mercury.excerpt,
      hasLoadedMercuryStuff: true,
      showMercuryContent: true
    }
  }

  // if excerpt == content_html, showMercury
  let decoratedItem = {
    ...item,
    banner_image: mercury.lead_image_url,
    // body: content,
    content_mercury: mercury.content ? mercury.content : '',
    excerpt: mercury.excerpt,
    hasLoadedMercuryStuff: true
  }
  if (isExcerptFirstPara(decoratedItem)) {
    let paras = decoratedItem.content_html.split('</p>')
    paras.shift()
    decoratedItem.content_html = paras.join('</p>')
  } else if (!isExcerptUseful(decoratedItem)) {
    decoratedItem.excerpt = undefined
  } else if (isExcerptExtract(decoratedItem)) {
    if (!decoratedItem.content_mercury ||
      decoratedItem.content_mercury == '' ||
      isExcerptExtract(decoratedItem, true)) {
      decoratedItem.excerpt = undefined
    } else {
      decoratedItem.showMercuryContent = true
    }
  }

  return decoratedItem
}

export function isExcerptUseful (item) {
  return item.excerpt && item.excerpt.length < 200
}

export function isExcerptFirstPara (item) {
  if (!item.content_html) return
  let firstPara = item.content_html.split('</p>')[0].replace('<p>', '')
  return firstPara && strip(firstPara) === item.excerpt
}

export function isExcerptExtract (item, isMercury = false) {
  if (!item.content_html) return false
  const excerptWithoutEllipsis = item.excerpt.substring(0, item.excerpt.length - 4)
  return strip(item.content_html).substring(0, excerptWithoutEllipsis.length) === excerptWithoutEllipsis
}

export function strip(content) {
  return content
    .replace(/<.*?>/g, '')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n+/g, ' ')
    .trim()
}

export function addCoverImageToItem (item, imageStuff) {
  return {
    ...item,
    ...imageStuff
  }
}

export function setShowCoverImage (item) {
  const getLongestContentLength = (item) => {
    const hasMercury = item.content_mercury && typeof item.content_mercury === 'string'
    const hasHtml = item.content_html && typeof item.content_mercury === 'string'
    const mercuryLength = hasMercury ?
      item.content_mercury.length :
      0
    const htmlLength = hasHtml ?
      item.content_html.length :
      0
    return mercuryLength > htmlLength ?
      mercuryLength :
      htmlLength
  }

  return {
    ...item,
    showCoverImage: item.hasCoverImage &&
      (getLongestContentLength(item) > 2000)
  }
}

export function removeDuplicateImage (item) {
  const escapeUrl = (Url) => Url.
    replace('.', '\.').
    replace('*', '\*').
    replace('?', '\?').
    replace('/', '\/').
    replace(':', '\:').
    replace('[', '\[').
    replace(']', '\]')
  if (item.showCoverImage && item.styles.coverImage.isInline && item.banner_image) {
    debugger
    const url = escapeUrl(item.banner_image)
    const figureRegEx = new RegExp(`<figure.*?img.*?src="${url}".*?\/figure>`)
    const imgRegEx = new RegExp(`<img.*?src="${url}".*?\/img>`)
    let content_html = item.content_html || ''
    let content_mercury = item.content_mercury || ''
    content_html = content_html.replace(figureRegEx, '').replace(imgRegEx, '')
    item = {
      ...item,
      content_html,
      content_mercury
    }
  }
  return item
}

export function removeCachedCoverImages (items) {
  if (!items) return
  items.forEach(item => {
    let path = getCachedImagePath(item)
    if (path) {
      RNFS.unlink(path)
        .catch((error) => {
          console.log(error)
        })
    }
  })
  // for (let item of items) {
  // }
}

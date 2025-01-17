import React, { useState } from 'react'
import {Linking} from 'react-native'
import {WebView} from 'react-native-webview'
import { openLink } from '../utils/open-link'
import { INITIAL_WEBVIEW_HEIGHT } from './FeedItem'
import { hslString } from '../utils/colors'
import { useSelector } from 'react-redux'

const calculateHeight = `
  (document.body && document.body.scrollHeight) &&
    window.ReactNativeWebView.postMessage(getHeight())
`

const injectedJavaScript = `
window.setTimeout(() => {
  if (document.body && document.body.scrollHeight) {
    const height = Math.ceil(document.querySelector('article').getBoundingClientRect().height)
    window.ReactNativeWebView.postMessage('resize:' + height);
  }  
}, 500);
window.onload = () => {
  if (document.body && document.body.scrollHeight) {
    const height = Math.ceil(document.querySelector('article').getBoundingClientRect().height)
    window.ReactNativeWebView.postMessage('resize:' + height);
  }  
};
true;`

let webView

const stripInlineStyles = (html) => {
  if (!html) return html
  const pattern = new RegExp(/style=".*?"/, 'g')
  return html.replace(pattern, '')
}

const stripEmptyTags = (html) => {
  const pattern = new RegExp(/<[^\/<]+?>\s*?<\/\1>/, 'g')
  return html ? html.replace(pattern, '') : html
}

const stripUTags = (html) => {
  const pattern = new RegExp(/<\/?u>/, 'g')
  return html.replace(pattern, '')
}

export default ItemBody = React.memo(({ bodyColor, item, onTextSelection, showImageViewer, updateWebViewHeight, webViewHeight }) => {
  const openLinksExternallyProp = /*__DEV__ ? {} :*/ {
    onShouldStartLoadWithRequest: (e) => {
      if (e.navigationType === 'click') {
        // Linking.openURL(e.url)
        openLink(e.url, hslString(item.feed_color))
        return false
      } else {
        return true
      }
    }
  }
  
  // called when HTML was loaded and injected JS executed
  const onNavigationStateChange = (event) => {
    // this means we're loading an image
    if (event.url.startsWith('react-js-navigation')) return
    const calculatedHeight = parseInt(event.jsEvaluationValue)
    if (calculatedHeight) {
      updateWebViewHeight(calculatedHeight)
    }
  }

  const { banner_image, content_html, content_mercury, feed_color, showCoverImage, showMercuryContent, styles } = item
  const fontSize = useSelector(state => state.ui.fontSize)
  const isDarkMode = useSelector(state => state.ui.isDarkMode)
  const displayMode = useSelector(state => state.itemsMeta.display)

  const isCoverImagePortrait = () => {
    const {imageDimensions} = item
    return imageDimensions && imageDimensions.height > imageDimensions.width
  }
    
  if (styles === undefined) {
    console.log('what?')
  }

  let articleClasses = [
    ...Object.values(styles.fontClasses),
    'itemArticle',
    styles.color,
    styles.dropCapFamily === 'header' ? 'dropCapFamilyHeader' : '',
    styles.dropCapIsMonochrome ? 'dropCapIsMonochrome' : '',
    `dropCapSize${styles.dropCapSize}`,
    styles.dropCapIsDrop ? 'dropCapIsDrop' : '',
    styles.dropCapIsBold ? 'dropCapIsBold' : '',
    styles.dropCapIsStroke ? 'dropCapIsStroke' : ''].join(' ')
    
  // this was on the body tag - is it still necessary?
  // const visibleClass = isVisible
  //   ? 'visible'
  //   : ''

  // and is this still necessary?
  // const scrollingClass = this.scrollAnim === 0
  //   ? ''
  //   : 'scrolling'
  const blockquoteClass = styles.hasColorBlockquoteBG ? 'hasColorBlockquoteBG' : ''

  const minHeight = webViewHeight === INITIAL_WEBVIEW_HEIGHT ? 1 : webViewHeight
  let server = ''
  if (__DEV__) {
    server = 'http://localhost:8888/'
  }

  if (!showCoverImage || isCoverImagePortrait()) {
    styles.coverImage = {
      ...styles.coverImage,
      isInline: false
    }
    styles.isCoverInline = false
  }

  let body = showMercuryContent ? content_mercury : content_html
  body = body || ''
  body = stripInlineStyles(body)
  body = stripEmptyTags(body)
  body = stripUTags(body)

  // hide the image in the body to avoid repetition
  let data = ''
  if (styles.coverImage.isInline) {
    data = banner_image
  }

  const feedColor = feed_color ?
    hslString(feed_color, 'darkmodable') :
    hslString('logo1')

  const html = `<html class="font-size-${fontSize} ${isDarkMode ? 'dark-background' : ''}">
<head>
  <style>
:root {
--feed-color: ${feedColor};
--font-path-prefix: ${ server === '' ? '../' : server };
}
  </style>
  <link rel="stylesheet" type="text/css" href="${server}webview/css/output.css">
  <link rel="stylesheet" type="text/css" href="${server}webview/css/fonts.css">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</head>
<body class="${blockquoteClass} ${displayMode}" style="background-color: ${bodyColor}" data-cover="${data}">
  <article
    class="${articleClasses}"
    style="min-height: ${minHeight}px; width: 100vw;">
    ${body}
  </article>
</body>
<script src="${server}webview/js/feed-item.js"></script>
</html>`

  return <WebView
    allowsFullscreenVideo={true}
    allowsLinkPreview={true}
    decelerationRate='normal'
    injectedJavaScript={ injectedJavaScript }
    mixedContentMode='compatibility'
    onMessage={(event) => {
      const msg = decodeURIComponent(decodeURIComponent(event.nativeEvent.data))
      if (msg.substring(0, 6) === 'image:') {
        showImageViewer(msg.substring(6))
      } else if (msg.substring(0, 5) === 'link:') {
        const url = msg.substring(5)
        // console.log('OPEN LINK: ' + url)
        if (!__DEV__) {
          Linking.openURL(url)
        }
      } else if (msg.substring(0,7) === 'resize:') {
        updateWebViewHeight(parseInt(msg.substring(7)))
      } else if (msg.substring(0, 7) === 'select:') {
        const selectedText = msg.substring(7)
        onTextSelection(selectedText)
      }
    }}
    onNavigationStateChange={onNavigationStateChange}
    {...openLinksExternallyProp}
    originWhitelist={['*']}
    ref={(ref) => { webView = ref }}
    scalesPageToFit={false}
    scrollEnabled={false}
    style={{
      alignItems: 'center',
      justifyContent: 'center',
      height: webViewHeight,
      backgroundColor: bodyColor
    }}
    source={{
      html: html,
      baseUrl: 'web/'}}
  />

})

// ItemBody.whyDidYouRender = true

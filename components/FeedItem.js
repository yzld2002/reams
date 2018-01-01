import React from 'react'
import {Animated, Dimensions, InteractionManager, Linking, ScrollView, View, WebView} from 'react-native'
import CoverImage from './CoverImage'
import ItemTitleContainer from '../containers/ItemTitle'
import {deepEqual} from '../utils/'
import {createItemStyles} from '../utils/createItemStyles'
import {onScrollEnd, scrollHandler} from '../utils/animationHandlers'


class FeedItem extends React.Component {
  constructor(props) {
    super(props)
    this.props = props

    if (!this.props.item.styles) {
      this.props.item.styles = createItemStyles(this.props.item)
    }
    this.scrollOffset = new Animated.Value(0)

    this.state = {
      headerClassList: this.getHeaderClasses(),
      webViewHeight: 5000 // a reasonable starting point?
    }

    this.removeBlackHeading = this.removeBlackHeading.bind(this)
    this.updateWebViewHeight = this.updateWebViewHeight.bind(this)
  }

  componentDidMount () {
    // this.loadMercuryStuff()
    // this.resizeTitleFontToFit()
    // this.markShortParagraphs()
    // this.markFirstParagraph()
    // this.hideFeedFlare()
  }

  diff (a, b, changes = {}) {
    changes = this.oneWayDiff (a, b, changes)
    return this.oneWayDiff(b, a, changes)
  }

  oneWayDiff (a, b, changes) {
    for (var key in a) {
      if (a[key] !== b[key] && changes[key] === undefined) {
        changes[key] = {
          old: a[key],
          new: b[key]
        }
      }
    }
    return changes
  }

  shouldComponentUpdate (nextProps, nextState) {
    let changes
    let isDiff = !deepEqual(this.props, nextProps) || !deepEqual(this.state, nextState)
    // console.log('Should update? - '
      // + this.props.item.title
      // + (isDiff ? ' - YES' : ' - NO'))
    if (isDiff) {
      changes = this.diff(this.props, nextProps, this.diff(this.state, nextState))
      console.log(this.props.item._id + ' (' + this.props.item.title + ') will update:')
      console.log(changes)
    }

    if (changes &&
        Object.keys(changes).length === 1 &&
        Object.keys(changes)[0] === 'isVisible') {
      console.log('Not updating, only `isVisible` has changed')
      isDiff = false

      // this is a bit sneaky...
      if (this.props.isVisible) {
        scrollHandler(this.scrollOffset)
      }
    }
    return isDiff
  }

  render () {
    let {
      feed_title,
      url,
      title,
      author,
      content_html,
      content_mercury,
      imagePath,
      imageDimensions,
      styles,
      date_published,
      excerpt
    } = this.props.item
    // console.log(`-------- RENDER: ${title} ---------`)
    // let bodyHtml = { __html: body }
    let articleClasses = [...styles.fontClasses, 'itemArticle', styles.color.name].join(' ')

    let headerClasses = this.state.headerClassList.join(' ')

    let coverImageClasses = ''
    let coverClasses = ''
    const visibleClass = this.props.isVisible
      ? 'visible'
      : ''
    const scrollingClass = this.scrollOffset === 0
      ? ''
      : 'scrolling'
    const blockquoteClass = styles.hasColorBlockquoteBG ? 'hasColorBlockquoteBG' : ''

    this.screenDimensions = Dimensions.get('window')
    const height = this.screenDimensions.height
    const calculateHeight = `(document.body && document.body.scrollHeight) ? document.body.scrollHeight : ${height * 2}`

    let server = ''
    if (__DEV__) {
      server = 'http://localhost:8888/'
    }

    if (this.props.isVisible) {
      scrollHandler(this.scrollOffset)
    }

    const authorHeading = !!author ? `<h2 class="author">${author}</h2>` : ''
    const excerptPara = !!excerpt ? `<p class="excerpt">${excerpt}</p>` : ''

    let body = this.props.showMercury ? content_mercury : content_html
    body = this.stripInlineStyles(body)

    const html = `<html>
      <head>
        <link rel="stylesheet" type="text/css" href="${server}webview/css/item-styles.css">
        <script src="${server}webview/js/feed-item.js"></script>
      </head>
      <body style="margin: 0; padding: 0;" class="${visibleClass} ${scrollingClass} ${blockquoteClass}">
        <article
          class="${articleClasses}">
          <!--div class="overlay" style="height: ${height}px; position: relative;">
            <div class="${headerClasses}" id='js-header'>
              <h1 id='js-title'><a href=${url || ''}>${title}</a></h1>
            </div>
          </div-->
          <div class="the-rest" style="position: absolute; top: ${height}px; min-height: ${height}px; width: 100vw;">
            <div class="top-block">
              ${authorHeading}
              <div class="feed-title-holder">
                <div class="feed-title js-feed-title collapsed">
                  <button class="feed-expand js-feed-expand">${feed_title}</button>
                  <div class="feed-num-unread">43 unread</div>
                  <button class="feed-unsubscribe">Unsubscribe</button>
                </div>
              </div>
            </div>
            <div class="body">${body}</div>
          </div>
        </article>
      </body>
    </html>`
    const openLinksExternallyProp = __DEV__ ? {} : {
      onShouldStartLoadWithRequest: (e) => {
        if (e.navigationType === 'click') {
          Linking.openURL(e.url)
          return false
        } else {
          return true
        }
      }
    }

    const coverImage = <CoverImage
            styles={styles.coverImage}
            scrollOffset={this.scrollOffset}
            imagePath={imagePath}
            imageDimensions={imageDimensions}
          />

    return (
      <View style={{
        flex: 1,
        overflow: 'hidden'
      }}>
        {!styles.isCoverInline && coverImage}
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: {
              contentOffset: { y: this.scrollOffset }
            }}],
            { useNativeDriver: true }
          )}
          onMomentumScrollBegin={this.onMomentumScrollBegin}
          onMomentumScrollEnd={this.onMomentumScrollEnd}
          onScrollEndDrag={this.onScrollEndDrag}
          ref={(ref) => { this.scrollView = ref }}
          scrollEventThrottle={1}
          style={{flex: 1}}
        >
          {styles.isCoverInline && coverImage}
          <ItemTitleContainer
            item={this.props.item}
            index={this.props.index}
            title={title}
            date={date_published}
            styles={styles.title}
            scrollOffset={this.scrollOffset}
            font={styles.fontClasses[0]}
            bodyFont={styles.fontClasses[1]}
            hasImage={!!imagePath}
          />
          <WebView
            decelerationRate='normal'
            injectedJavaScript={calculateHeight}
            {...openLinksExternallyProp}
            ref={(ref) => { this.webView = ref }}
            scalesPageToFit={false}
            scrollEnabled={false}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              height: this.state.webViewHeight,
              backgroundColor: 'transparent'
            }}
            source={{
              html: html,
              baseUrl: 'web/'}}
            onNavigationStateChange={this.updateWebViewHeight}
          />
        </Animated.ScrollView>
      </View>
    )
  }

  // nasty workaround to figure out scrollEnd
  // https://medium.com/appandflow/react-native-collapsible-navbar-e51a049b560a
  onScrollEndDrag = () => {
    this.scrollEndTimer = setTimeout(this.onMomentumScrollEnd, 250)
  }

  onMomentumScrollBegin = () => {
    clearTimeout(this.scrollEndTimer)
  }

  onMomentumScrollEnd = () => {
    onScrollEnd()
  }

  //called when HTML was loaded and injected JS executed
  updateWebViewHeight (event) {
    const calculatedHeight = parseInt(event.jsEvaluationValue) || this.screenDimensions.height * 2
    if (!this.pendingWebViewHeight || calculatedHeight > this.pendingWebViewHeight) {
      this.pendingWebViewHeight = calculatedHeight
    }

    const that = this
    // debounce
    if (!this.pendingWebViewHeightId) {
      this.pendingWebViewHeightId = setTimeout(() => {
        that.setState({
          ...that.state,
          webViewHeight: that.pendingWebViewHeight
        })
        that.pendingWebViewHeightId = null
      }, 1000)
    }
  }

  removeBlackHeading () {
    if (this.props.item.styles.title.color.name === 'black') {
      this.props.item.styles.title.color = {
        name: 'white',
        hex: '#ffffff',
        rgba: 'rgba(255,255,255,1)'
      }
    }
  }

  stripInlineStyles (html) {
    const pattern = new RegExp(/style=".*"/, 'g')
    return html.replace(pattern, '')
  }

  // openLinksExternally (e) {
  //   let el = e.target
  //   // TODO don't rely on this
  //   while (el.tagName !== 'ARTICLE') {
  //     if (el.tagName === 'A') {
  //       e.stopPropagation()
  //       e.preventDefault()
  //       let url = el.getAttribute('href')
  //       window.open(url, '_system')
  //       break
  //     }
  //     el = el.parentElement
  //   }
  // }

  // getOverlayInlineStyles () {
  //   let baseStyle = 'height: 100vh;'
  //   let extras = ''

  getHeaderClasses = () => {
    let classes = ['header']
    let vAlign = ['headerBottom', 'headerMiddle', 'headerTop']
    classes.push(vAlign[Math.floor(Math.random() * 2.5)])
    if ((classes.indexOf('headerMiddle') > 0 && Math.random() > 0.2)
        || Math.random() > 0.5) {
      classes.push('headerCentered')
    }
    // if (Math.random() > 0.8) {
    //   classes.push('headerUnderlined')
    // }
    if (Math.random() > 0.5) {
      classes.push('headerItalic')
    }
    if (Math.random() > 0.9) {
      classes.push('headerBlock')
    } else if (Math.random() > 0.9) {
      classes.push('headerBlockInverse')
    }
    if (this.props.item.title.length > 80) {
      classes.push('headerSmall')
    // } else if (Math.random() > 0.8 &&
    //     classes.indexOf('headerBlock') === -1 &&
    //     classes.indexOf('headerBlockInverse') === -1) {
    //   classes.push('headerSmall')
    //   classes.push('headerSheepStealer')
    }

    let colors = ['headerBlack', 'header-' + this.props.item.styles.color.name]
    let index = Math.floor(Math.random() * 2)
    classes.push(colors[index])
    return classes
  }

  // calculateElementWidth = (titleEl) => {
  //   let titleWidth = titleEl.getBoundingClientRect().width

  //   // TODO calculate padding/margin + padding of parent
  //   titleWidth += 28

  //   return titleWidth
  // }


}

export default FeedItem

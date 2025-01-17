import React from 'react'
import {ActivityIndicator, Animated, Dimensions, Easing, Linking, View} from 'react-native'
import CoverImage from './CoverImage'
import ItemBody from './ItemBody'
import ItemTitleContainer from '../containers/ItemTitle'
import {deepEqual, deviceCanHandleAnimations, diff, getCachedCoverImagePath} from '../utils/'
import { hslString } from '../utils/colors'

export const INITIAL_WEBVIEW_HEIGHT = 1000

class FeedItem extends React.Component {
  // static whyDidYouRender = true
  constructor(props) {
    super(props)
    this.props = props
    // if (__DEV__) {
    //   this.props.item.styles = createItemStyles(this.props.item)
    // }

    this.scrollAnim = new Animated.Value(0)

    this.state = {
      webViewHeight: INITIAL_WEBVIEW_HEIGHT
    }

    this.initAnimatedValues(false)

    this.removeBlackHeading = this.removeBlackHeading.bind(this)
    this.updateWebViewHeight = this.updateWebViewHeight.bind(this)
    this.addAnimation = this.addAnimation.bind(this)

    this.screenDimensions = Dimensions.get('window')
    this.hasWebViewResized = false

    this.wasShowCoverImage = this.props.item.showCoverImage
    this.currentScrollOffset = 0
  }

  initAnimatedValues (isMounted) {
    const { panAnim } = this.props
    const anims = [0, 0, 0, 0, 0, 0].map((a, i) => {
      const inputRange = [0, 0.3, 0.7, 1, 1.3 - i * 0.05, 1.7 + i * 0.05, 2]
      const outputRange = [0, 0.3, 0.7, 1, 1.3, 1.7, 2]
      // console.log(inputRange)
      // console.log(outputRange)
      return panAnim.interpolate({
        inputRange,
        outputRange
      })
    })
    if (isMounted && JSON.stringify(this.anims) !== JSON.stringify(anims)) {
      this.anims = anims
      // weird little hack to ensure a re-render
      // (when I put the anims into state I got ugly errors)
      this.setState({
        animsUpdated: Date.now()
      })
    } else {
      this.anims = anims
    }
  }

  addAnimation (style, anim, isVisible) {
    const width = Dimensions.get('window').width * 0.05
    if (isVisible) {
      return {
        ...style,
        left: width,
        opacity: anim.interpolate({
          inputRange: [0, 1, 1.05, 1.1, 2],
          outputRange: [1, 1, 1, 1, 1]
        }),
        transform: [{
          translateX: anim.interpolate({
            inputRange: [0, 1.01, 1.1, 2],
            outputRange: [-width, -width, -width, -width]
          })
        }]
      }
    } else {
      return {
        ...style,
        left: width,
        opacity: anim.interpolate({
          inputRange: [0, 1, 1.05, 1.1, 2],
          outputRange: [1, 1, 1, 0, 0]
        }),
        transform: [{
          translateX: anim.interpolate({
            inputRange: [0, 1.01, 1.1, 2],
            outputRange: [-width, -width, width * 4, width * 4]
          })
        }]
      }  
    }
  }
  
  componentDidMount () {
    const {
      isVisible,
      item,
      setScrollAnim,
    } = this.props
    if (isVisible) {
      setScrollAnim(this.scrollAnim)
      // scrollHandlerAttached(item._id)
      item.scrollRatio > 0 && this.scrollToOffset()
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (this.isAnimating) return true
    const { item } = this.props
    let changes
    let isDiff = !deepEqual(this.props, nextProps) || !deepEqual(this.state, nextState)
    if (isDiff) {
      changes = diff(this.props, nextProps, diff(this.state, nextState))
    }

    // various special cases
    if (changes && changes.item && Object.keys(changes.item).length === 0) {
      delete changes.item
    }
    if (changes && Object.keys(changes).length === 0) {
      isDiff == false
    } else if (changes && Object.keys(changes).length === 1) {
      switch (Object.keys(changes)[0]) {
        case 'isVisible':
          // isDiff = false
          // this is a bit sneaky...
          if (nextProps.isVisible) {
            setTimeout(() => {
              this.props.setScrollAnim(this.scrollAnim)
            }, 0)
          }
          break

        case 'fontSize':
          if (this.webView) {
            isDiff = false
            this.webView.injectJavaScript(`setFontSize(${nextProps.fontSize})`)
          }
          break

        case 'isDarkMode':
          if (this.webView) {
            isDiff = false
            this.webView.injectJavaScript(`toggleDarkMode(${nextProps.isDarkMode})`)
          }
          break

        case 'index':

        case 'item':
          if (Object.keys(changes.item).length === 1) {
            switch (Object.keys(changes.item)[0]) {
              case 'scrollRatio':
              case 'readingTime':
              case 'readAt':
                isDiff = false
                break
            }
          }
          break

        case 'panAnim':
          console.log('panAnim changed!')
      }
    }
    return isDiff
  }

  componentDidUpdate (prevProps) {
    const { isVisible, item, setScrollAnim } = this.props
    if (this.props.renderDate !== prevProps.renderDate) {
      this.initAnimatedValues(true)
    }
    if (isVisible && !prevProps.isVisible) {
      setScrollAnim(this.scrollAnim)
      this.scrollToOffset()
    }
  }

  scrollToOffset () {
    const {item} = this.props
    const {webViewHeight} = this.state
    const scrollView = this.scrollView
    if (!item.scrollRatio || typeof item.scrollRatio !== 'object') return
    const scrollRatio = item.scrollRatio[item.showMercuryContent ? 'mercury' : 'html']
    if (!scrollView || !this.hasWebViewResized) return
    if (!scrollRatio || scrollRatio === 0) return
    setTimeout(() => {
      scrollView.scrollTo({
        x: 0,
        y: scrollRatio * webViewHeight,
        animated: true
      })
    }, 2000)
  }

  isInflated () {
    const inflated = typeof this.props.item.content_html !== 'undefined'
      && typeof this.props.item.styles !== 'undefined'
    return inflated
  }

  render () {
    if (!this.isInflated()) {
      return <View style={{
        width: this.screenDimensions.width,
        height: this.screenDimensions.height }} />
    }

    const {
      isVisible,
      item,
      showMercuryContent 
    } = this.props
    let {
      title,
      faceCentreNormalised,
      hasCoverImage,
      imageDimensions,
      showCoverImage,
      styles,
      created_at,
      savedAt
    } = this.props.item

    const { webViewHeight } = this.state

    const bodyColor = this.props.isDarkMode ? 'black' : hslString('rizzleBg')
    const that = this

    const coverImage = showCoverImage ? 
      <CoverImage
        styles={styles.coverImage}
        scrollAnim={this.scrollAnim}
        imagePath={!!hasCoverImage && getCachedCoverImagePath(item)}
        imageDimensions={!!hasCoverImage && imageDimensions}
        faceCentreNormalised={faceCentreNormalised}
        feedTitle={item.feed_title}
      /> :
      null

    const bodyStyle = {
      backgroundColor: bodyColor
    }

    return (
      <View
        ref={(ref) => { this.view = ref }}
        style={{
          backgroundColor: bodyColor,
          flex: 1,
          overflow: 'hidden'
        }}
      >
        { showCoverImage && !styles.isCoverInline && coverImage }
        <Animated.ScrollView
          onScroll={this.scrollAnim && Animated.event(
              [{ nativeEvent: {
                contentOffset: { y: this.scrollAnim }
              }}],
              {
                useNativeDriver: true
              }
            )}
          onMomentumScrollBegin={this.onMomentumScrollBegin}
          onMomentumScrollEnd={this.onMomentumScrollEnd}
          onScrollEndDrag={this.onScrollEndDrag}
          pinchGestureEnabled={false}
          ref={(ref) => { this.scrollView = ref }}
          scrollEventThrottle={1}
          style={{
            flex: 1,
            minHeight: 100,
            minWidth: 100
          }}
        >
          { showCoverImage && styles.isCoverInline && coverImage }
          <ItemTitleContainer
            anims={this.anims}
            addAnimation={this.addAnimation}
            item={item}
            isVisible={isVisible}
            title={title}
            excerpt={item.excerpt}
            date={savedAt || created_at}
            scrollOffset={this.scrollAnim}
            font={styles.fontClasses.heading}
            bodyFont={styles.fontClasses.body}
            hasCoverImage={hasCoverImage}
            showCoverImage={showCoverImage}
            coverImageStyles={styles.coverImage}
            layoutListener={(bottomY) => this.setWebViewStartY(bottomY)}
          />
          <Animated.View style={webViewHeight !== INITIAL_WEBVIEW_HEIGHT && // avoid https://sentry.io/organizations/adam-butler/issues/1608223243/
            (styles.coverImage?.isInline || !showCoverImage) ? 
              this.addAnimation(bodyStyle, this.anims[5], isVisible) :
              bodyStyle}
          >
            <View style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              paddingTop: 100,
              backgroundColor: bodyColor
            }}>
              <ActivityIndicator size="large" color={hslString('rizzleFG')}/>
            </View>
            <ItemBody 
              bodyColor={bodyColor}
              item={item}
              onTextSelection={this.props.onTextSelection}
              showImageViewer={this.props.showImageViewer}
              updateWebViewHeight={this.updateWebViewHeight}
              webViewHeight={this.state.webViewHeight}
          />
          </Animated.View>
        </Animated.ScrollView>
      </View>
    )
  }

  setWebViewStartY (y) {
    // this is causing the `CALayerInvalidGeometry` bug
    // https://sentry.io/organizations/adam-butler/issues/1608223243
    // so don't call setState for now until I figure it out
    // (to do with the animation that is set of the Animated.View that holds the WebView)
    if (y < this.screenDimensions.height) {
      // this.setState({
      //   webViewHeight: Math.round(this.screenDimensions.height - y)
      // })
    }
  }

  passScrollPositionToWebView (position) {
    // console.log(position)
  }

  // nasty workaround to figure out scrollEnd
  // https://medium.com/appandflow/react-native-collapsible-navbar-e51a049b560a
  onScrollEndDrag = (e) => {
    const that = this
    const offset = e.nativeEvent.contentOffset.y
    this.scrollEndTimer = setTimeout(() => {
      that.onMomentumScrollEnd.apply(that, [offset])
    }, 250)
  }

  onMomentumScrollBegin = (e) => {
    clearTimeout(this.scrollEndTimer)
  }

  onMomentumScrollEnd = (scrollOffset) => {
    scrollOffset = typeof scrollOffset === 'number' ?
      scrollOffset :
      scrollOffset.nativeEvent.contentOffset.y
    this.currentScrollOffset = scrollOffset
    this.props.setScrollOffset(this.props.item, scrollOffset, this.state.webViewHeight)
    this.props.onScrollEnd(scrollOffset)
  }

  // called when HTML was loaded and injected JS executed
  onNavigationStateChange (event) {
    // this means we're loading an image
    if (event.url.startsWith('react-js-navigation')) return
    const calculatedHeight = parseInt(event.jsEvaluationValue)
    if (calculatedHeight) {
      this.updateWebViewHeight(calculatedHeight)
    }
  }

  updateWebViewHeight (height) {
    if (!this.pendingWebViewHeight || height !== this.pendingWebViewHeight) {
      this.pendingWebViewHeight = height
    }

    if (Math.abs(height - this.state.webViewHeight) < height * 0.1) {
      return
    }
    // console.log('Trying to set webview height: ' + this.pendingWebViewHeight)

    const that = this
    if (this.pendingWebViewHeight !== this.state.webViewHeight) {
      // debounce
      if (!this.pendingWebViewHeightId) {
        this.pendingWebViewHeightId = setTimeout(() => {
          that.setState({
            ...that.state,
            webViewHeight: that.pendingWebViewHeight
          })
          if (that.currentScrollOffset > 0) {
            that.scrollToOffset()
          }
          that.pendingWebViewHeightId = null
          that.hasWebViewResized = true
        }, 500)
      }
    }
  }

  removeBlackHeading () {
    if (this.props.item.styles.title.color === 'black') {
      this.props.item.styles.title.color = 'white'
    }
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

  // calculateElementWidth = (titleEl) => {
  //   let titleWidth = titleEl.getBoundingClientRect().width

  //   // TODO calculate padding/margin + padding of parent
  //   titleWidth += 28

  //   return titleWidth
  // }


}

export default FeedItem

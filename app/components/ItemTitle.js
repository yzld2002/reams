import React from 'react'
import {Animated, Dimensions, Text, View, WebView} from 'react-native'
import {BlurView} from 'react-native-blur'
import moment from 'moment'

import {hslString} from '../utils/colors'
import {isIphoneX} from '../utils'

const fontStyles = {
  headerFontSerif1: {
    bold: {
      fontFamily: 'IBMPlexSerif-Bold',
      multiplier: 0.57
    },
    boldItalic: {
      fontFamily: 'IBMPlexSerif-BoldItalic',
      multiplier: 0.57
    },
    regular: {
      fontFamily: 'IBMPlexSerif-Light',
      multiplier: 0.51
    },
    regularItalic: {
      fontFamily: 'IBMPlexSerif-LightItalic',
      multiplier: 0.51
    }
  },
  headerFontSerif2: {
    bold: {
      fontFamily: 'Arvo-Bold',
      multiplier: 0.58
    },
    boldItalic: {
      fontFamily: 'Arvo-BoldItalic',
      multiplier: 0.58
    },
    regular: {
      fontFamily: 'Arvo',
      multiplier: 0.56
    },
    regularItalic: {
      fontFamily: 'Arvo-Italic',
      multiplier: 0.56
    }
  },
  headerFontSerif3: {
    bold: {
      fontFamily: 'PlayfairDisplay-Black',
      multiplier: 0.58
    },
    boldItalic: {
      fontFamily: 'PlayfairDisplay-BlackItalic',
      multiplier: 0.58
    },
    regular: {
      fontFamily: 'PlayfairDisplay-Regular',
      multiplier: 0.56
    },
    regularItalic: {
      fontFamily: 'PlayfairDisplay-Italic',
      multiplier: 0.56
    }
  },
  headerFontSans1: {
    verticalOffset: 0.1,
    bold: {
      fontFamily: 'AvenirNextCondensed-Bold',
      multiplier: 0.46
    },
    boldItalic: {
      fontFamily: 'AvenirNextCondensed-BoldItalic',
      multiplier: 0.46
    },
    regular: {
      fontFamily: 'AvenirNextCondensed-Medium',
      multiplier: 0.42
    },
    regularItalic: {
      fontFamily: 'AvenirNextCondensed-MediumItalic',
      multiplier: 0.42
    }
  },
  headerFontSans2: {
    bold: {
      fontFamily: 'Montserrat-Bold',
      multiplier: 0.75
    },
    boldItalic: {
      fontFamily: 'Montserrat-BoldItalic',
      multiplier: 0.75
    },
    regular: {
      fontFamily: 'Montserrat-Light',
      multiplier: 0.55
    },
    regularItalic: {
      fontFamily: 'Montserrat-LightItalic',
      multiplier: 0.55
    }
  },
  headerFontSans3: {
    bold: {
      fontFamily: 'IBMPlexSans-Bold',
      multiplier: 0.54
    },
    boldItalic: {
      fontFamily: 'IBMPlexSans-BoldItalic',
      multiplier: 0.54
    },
    regular: {
      fontFamily: 'IBMPlexSans-Light',
      multiplier: 0.51
    },
    regularItalic: {
      fontFamily: 'IBMPlexSans-LightItalic',
      multiplier: 0.51
    }
  },
  bodyFontSans1: {
    fontFamily: 'GillSans-LightItalic'
  },
  bodyFontSans2: {
    fontFamily: 'Avenir-LightOblique'
  },
  bodyFontSerif1: {
    fontFamily: 'Cochin'
  },
  bodyFontSerif2: {
    fontFamily: 'IowanOldStyle-Roman'
  }
}

const commonWords = [
  'the',
  'of',
  'and',
  'to',
  'a',
  'in',
  'for',
  'is',
  'on',
  'that',
  'by',
  'this',
  'with',
  'i',
  'you',
  'it',
  'not',
  'or',
  'be',
  'are',
  'from',
  'at',
  'as',
  'your',
  'all',
  'have',
  'more',
  'an',
  'was',
  'we',
  'will',
  'home',
  'can',
  'us',
  'about',
  'if',
  'my',
  'has',
  'but',
  'our',
  'one',
  'other',
  'do',
  'no',
  'they',
  'he',
  'up',
  'may',
  'what',
  'which',
  'their',
  'out',
  'use',
  'any',
  'there',
  'see',
  'only',
  'so',
  'his',
  'when',
  'here',
  'who',
  'also',
  'now',
  'get',
  'am',
  'been',
  'would',
  'how',
  'were',
  'me',
  'some',
  'these',
  'its',
  'like',
  'than',
  'had',
  'into',
  'them',
  'should',
  'her',
  'such',
  'after',
  'then'
]


class ItemTitle extends React.Component {
  constructor (props) {
    super(props)
    this.props = props

    const window = Dimensions.get('window')
    this.screenWidth = window.width
    this.screenHeight = window.height

    this.verticalMargin = props.coverImageStyles.isInline ?
      0 :
      this.screenHeight * -0.1

    // um...
    const verticalPadding = 85
    // double um...
    this.paddingTop = isIphoneX() ?
        verticalPadding * 1.25 + this.screenHeight * 0.1 :
        verticalPadding + this.screenHeight * 0.1
    this.paddingBottom = verticalPadding + this.screenHeight * 0.1

    if (this.props.coverImageStyles.isInline) {
      this.paddingTop = 16
      this.paddingBottom = 0
    }

    this.fadeInAnim = props.coverImageStyles.isInline ? new Animated.Value(-1) :  new Animated.Value(0)
    this.fadeInAnim2 = props.coverImageStyles.isInline ? new Animated.Value(-1) :  new Animated.Value(0)
  }

  calculateMaxFontSize (title, font, isBold, totalPadding) {
    const maxLength = this.getLongestWord(title)
    const multiplier = fontStyles[this.props.font][isBold ? 'bold' : 'regular'].multiplier
    const width = this.screenWidth - totalPadding

    // multiply by 0.9 to give us a buffer
    return Math.floor(width / maxLength / (multiplier * 1.2))
  }

  adjustFontSize (height) {
    const maxHeight = this.screenHeight - this.paddingTop - this.paddingBottom
    if (height > maxHeight) {
      // const fontSize = this.props.styles.fontSize
      // const oversizeFactor = height / maxHeight
      // const newFontSize = Math.round(fontSize / oversizeFactor * 0.9)
      // console.log(this.props.title + ' - NEW FONT SIZE: ' + this.fontSize + ' > ' + Math.floor(this.fontSize * 0.9))
      this.props.updateFontSize(this.props.item, Math.floor(this.fontSize * 0.9))
    } else {
      // tell it that the max font we calculated is just fine thank you
      this.props.updateFontSize(this.props.item, Math.floor(this.fontSize))
    }
  }

  getLongestWord (title) {
    return title.split(' ').reduce((length, word) => {
      if (word.length > length)
        length = word.length
      return length
    }, 0)
  }

  componentDidMount () {
    // if (this.innerView) {
    //   this.innerView._component.measure((ox, oy, width, height) => {
    //     console.log(height)
    //     if (height > this.screenHeight - verticalPadding * 2) {
    //       console.log('Too high!')
    //     }
    //   })
    // }
  }

  render () {
    let {styles, title, date, hasCoverImage, coverImageStyles, isVisible} = this.props
    let position = {
      height: 'auto',
      width: 'auto',
      maxWidth: this.screenWidth
    }
    // TODO: make the $step value dynamic, somehow?
    const fullWidthStyle = {
      width: this.screenWidth - 56
    }

    const {opacity, excerptOpacity, shadow} = this.getOpacityValues()
    const toValue = coverImageStyles.isVisible ? 1 : 0

    if (isVisible) {
      Animated.stagger(500, [
        Animated.timing(this.fadeInAnim, {
          toValue,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(this.fadeInAnim2, {
          toValue,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start()
    }

    // account for landscape mode
    this.fontSize = Math.min(this.screenWidth, this.screenHeight) / styles.fontSizeAsWidthDivisor

    if (styles.maximiseFont && !styles.fontResized) {
      const totalPadding = styles.bg ? 56 : 28
      this.fontSize = this.calculateMaxFontSize(title, this.props.font, styles.isBold, totalPadding)
    }

    const verticalOffset = fontStyles[this.props.font].verticalOffset ?
      fontStyles[this.props.font].verticalOffset * this.fontSize :
      0

    const color = styles.isMonochrome ?
      (hasCoverImage && !styles.bg ?
        'white' :
        'black') :
      hslString(styles.color)

    const invertBGPadding = 5
    const paddingTop = styles.invertBG ? (verticalOffset + invertBGPadding) : verticalOffset
    const paddingBottom = styles.invertBG ? invertBGPadding : 0
    const paddingLeft = styles.invertBG ? invertBGPadding : 0

    let fontType
    if (styles.isBold && styles.isItalic) {
      fontType = 'boldItalic'
    } else if (styles.isBold) {
      fontType = 'bold'
    } else if (styles.isItalic) {
      fontType = 'regularItalic'
    } else {
      fontType = 'regular'
    }

    let fontStyle = {
      fontFamily: fontStyles[this.props.font][fontType].fontFamily,
      color,
      fontSize: this.fontSize,
      lineHeight: this.fontSize * 1.05,
      textAlign: styles.textAlign,
      letterSpacing: styles.isVertical ?
        (this.getLongestWord(title) < 6 ? 5 : 3) :
        (this.getLongestWord(title) < 6 ? 3 : -1),
      paddingTop,
      paddingBottom,
      paddingLeft,
      // marginBottom: this.props.styles.isUpperCase ? this.fontSize * -0.3 : 0
    }
    const viewStyle = {
      ...position
    }

    const borderWidth = styles.invertBG ? 0 : styles.borderWidth
    const borderTop = { borderTopWidth: borderWidth }
    const borderBottom = { borderBottomWidth: borderWidth }
    const borderAll = { borderWidth }
    let border = styles.valign === 'top' ?
      borderBottom :
      (styles.valign === 'bottom' ? borderTop :
        (styles.textAlign === 'center' ?
          borderAll :
          {
            ...borderTop,
            ...borderBottom
          }
        ))
    if (coverImageStyles.isInline) border = {}

    // if center aligned and not full width, add left margin
    const defaultHorizontalMargin = coverImageStyles.isInline ? 8 : 16 // allow space for date
    const widthPercentage = styles.widthPercentage || 100
    const width = (this.screenWidth - defaultHorizontalMargin * 2) * widthPercentage / 100
    const horizontalMargin = (this.screenWidth - width) / 2

    const hasLeftPadding = styles.bg || styles.textAlign === 'center' &&
      styles.valign === 'middle' &&
      !coverImageStyles.isInline

    const innerViewStyle = {
      // horizontalMargin: styles.bg ? 28 + horizontalMargin : horizontalMargin,
      // marginRight:  styles.bg ? 28  + horizontalMargin : horizontalMargin,
      marginLeft: horizontalMargin,
      marginRight:  horizontalMargin,
      paddingLeft: hasLeftPadding ? 16 : 0,
      paddingRight: hasLeftPadding ? 16 : 0,
      paddingBottom: 16,
      paddingTop: coverImageStyles.isInline ? 0 : 16,
      backgroundColor: styles.bg ?  'white' : 'transparent',
      height: 'auto',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      width,
      ...border,
      borderColor: color,
      opacity: coverImageStyles.isInline ? opacity : 1
    }
    const overlayColour = hasCoverImage && !styles.invertBGPadding && !styles.bg ?
      (styles.isMonochrome || coverImageStyles.isBW || coverImageStyles.isMultiply ?
        'rgba(0,0,0,0.1)' :
        'rgba(0,0,0,0.3)') :
      'transparent'
    const outerViewStyle = {
      width: this.screenWidth,
      height: coverImageStyles.isInline ? 'auto' : this.screenHeight * 1.2,
      // position: 'absolute',
      paddingTop: this.paddingTop,
      paddingBottom: this.paddingBottom,
      marginTop: this.verticalMargin,
      marginBottom: this.verticalMargin,
      top: 0,
      left: 0,
      flexDirection: 'column',
      backgroundColor: coverImageStyles.isInline ?
        hslString(coverImageStyles.color) :
        overlayColour,
      opacity: coverImageStyles.isInline ? 1 : opacity
    }
    let textStyle = {
      ...fontStyle,
      // ...viewStyle
    }

    let dateStyle = {
      position: 'absolute',
      top: this.screenHeight * (styles.valign === 'bottom' ? 0.2 : 0.7), // heuristic
      color,
      backgroundColor: 'transparent',
      fontSize: 12,
      fontFamily: 'IBMPlexMono',
      lineHeight: 18,
      textAlign: 'center',
      marginLeft: 0,
      marginRight:  0,
      padding: 0,
      width: this.screenWidth,
      transform: [
        {translateY: 100},
        {translateX: (this.screenWidth / 2) - 6},
        {rotateZ: '90deg'}
      ]
    }

    let shadowStyle = styles.hasShadow && !styles.bg && !coverImageStyles.isInline ? {
      textShadowColor: 'rgba(0,0,0,0.1)',
      textShadowOffset: { width: shadow, height: shadow }
    } : {}

    textStyle = {
      ...fontStyle,
      ...shadowStyle
    }
    dateStyle = {
      ...dateStyle,
      ...shadowStyle
    }

    const invertedTitleStyle = {
      color: styles.isMonochrome ? 'black' : 'white'
    }

    const invertedTitleWrapperStyle = {
      backgroundColor: styles.isMonochrome ? 'white' : color
    }

    let server = ''
    if (__DEV__) {
      server = 'http://localhost:8888/'
    }

    const html = `<html>
      <head>
        <link rel="stylesheet" type="text/css" href="${server}webview/css/item-styles.css">
        <script src="${server}webview/js/feed-item.js"></script>
      </head>
      <body style="margin: 0; padding: 0;">
        <h1>${title.replace(' ', '\n')}</h1>
      </body>
    </html>`

    const justifiers = {
      'top': 'flex-start',
      'middle': 'center',
      'bottom': 'flex-end'
    }
    const aligners = {
      'left': 'flex-start',
      'center': 'center'
    }

    title = title.replace(/\n/g, '')
    // TODO: actually replace italics?
    title = title.replace(/<.*?>/g, '')

    const words = title.split(' ')
    let wordStyles = null

    // TODO: move these calculations into createItemStyles() (probably)
    let common = uncommon = 0
    words.forEach(word => {
      if (commonWords.find(cw => cw === word.toLowerCase())) {
        common++
      } else {
        uncommon++
      }
    })
    const commonWordRatio = common / uncommon
    if (commonWordRatio > 0.5 && common > 3) {
      // create a parallel array of objects that we can convert into jsx below
      // (make objects first because whether we use Text or Animated.Text depends on whether to invert)
      // (because shadow)
      wordStyles = []
      words.forEach((word, index) => {
        if (commonWords.find(cw => cw === word.toLowerCase())) {
          wordStyles[index] = {
            fontFamily: fontStyles[this.props.font][styles.isItalic ? 'regularItalic' : 'regular'].fontFamily,
            height: this.fontSize
          }
        } else {
          wordStyles[index] = {
            fontFamily: fontStyles[this.props.font]['bold'].fontFamily,
            height: this.fontSize
          }
        }
      })
    } else {
      if (this.props.styles.isUpperCase) {
        title = title.toLocaleUpperCase()
      }
      if (this.props.styles.isVertical) {
        title = title.trim().replace(/ /g, '\n')
      }
    }

    const dateView = <Animated.Text style={dateStyle}>{moment(date * 1000).format('dddd MMM Do, h:mm a')}</Animated.Text>

    const shouldSplitIntoWords = () => {
      return wordStyles || styles.invertBG
    }

    if (shouldSplitIntoWords()) {
      title = words.map((word, index) => {
        if (styles.invertBG) {
          return (<View key={index} style={{
            ...invertedTitleWrapperStyle
          }}><Text style={{
            ...fontStyle,
            ...(wordStyles && wordStyles[index]),
            ...invertedTitleStyle,
            height: this.fontSize + paddingTop + paddingBottom
          }}>{word} </Text>
          </View>)
        } else {
          return (<Animated.Text key={index} style={{
            ...fontStyle,
            ...(wordStyles && wordStyles[index]),
            ...shadowStyle,
            height: this.fontSize
          }}>{word} </Animated.Text>)
        }
      })
    }

    const excerptColor = styles.isMonochrome ?
      (hasCoverImage && !styles.bg ?
        'white' :
        'black') :
      hslString(styles.color)
    // const excerptColor = styles.bg ?
    //   (styles.isMonochrome ? 'black' : hslString(styles.color)) :
    //   (hasCoverImage ? 'white' : 'black')
    const excerptFontSize = this.screenWidth > this.screenHeight ?
      this.screenWidth / 42 :
      this.screenHeight / 42
    const excerptView = (<Animated.View style={{
        ...innerViewStyle,
        borderTopWidth: 0,
        opacity: excerptOpacity
      }}>
        <Animated.Text style={{
          justifyContent: aligners[styles.textAlign],
          flex: 1,
          ...fontStyle,
          ...shadowStyle,
          textShadowColor: 'rgba(0,0,0,0.4)',
          textShadowRadius: 20,
          color: excerptColor,
          fontFamily: fontStyles[this.props.font]['regular'].fontFamily,
          fontSize: excerptFontSize,
          lineHeight: excerptFontSize * 1.2,
          letterSpacing: 0,
        }}>{this.props.excerpt}</Animated.Text>
      </Animated.View>)

    return (
      <Animated.View style={{
        ...outerViewStyle,
        justifyContent: justifiers[styles.valign]
      }}>
        <Animated.View
          style={{
            ...innerViewStyle,
            justifyContent: aligners[styles.textAlign]
          }}
          onLayout={(event) => {
            this.adjustFontSize(event.nativeEvent.layout.height)
          }}
          ref={(view) => { this.innerView = view }}
        >
          {typeof(title) === 'object' && title}
          {typeof(title) === 'string' &&
            <Animated.Text style={{
              // ...fullWidthStyle,
              ...fontStyle,
              ...shadowStyle,
              marginBottom: this.props.styles.isUpperCase ? this.fontSize * -0.3 : 0
            }}>
              <Animated.Text>{title}</Animated.Text>
            </Animated.Text>
          }
        </Animated.View>
        { this.props.item.excerpt &&
          !this.props.item.excerpt.includes('ellip') &&
          !this.props.item.excerpt.includes('…') &&
          excerptView }
        {dateView}
      </Animated.View>
    )
  }

  getOpacityValues () {
    if (this.props.coverImageStyles.isInline) {
      return {
        opacity: 1,
        excerptOpacity: 1,
        shadow: 1
      }
    }
    return {
      opacity: Animated.add(this.props.scrollOffset.interpolate({
          inputRange: [-50, 0, 100],
          outputRange: [0, 1, 0]
        }), this.fadeInAnim),
      excerptOpacity: Animated.add(this.props.scrollOffset.interpolate({
          inputRange: [-50, 0, 100],
          outputRange: [0, 1, 0]
        }), this.fadeInAnim2),
      shadow: this.props.scrollOffset.interpolate({
          inputRange: [-100, -20, 0, 40, 200],
          outputRange: [0, 1, 1, 1, 0]
        })
    }
  }

}

export default ItemTitle

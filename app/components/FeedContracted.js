import React from 'react'
import {
  Dimensions,
  Image,
  InteractionManager,
  PanResponder,
  ScrollView,
  StatusBar,
  StatusBarAnimation,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import Animated, { Easing } from 'react-native-reanimated'
import { TapGestureHandler, State } from 'react-native-gesture-handler'
import { blendColor, hslString } from '../utils/colors'
import FeedCoverImage from './FeedCoverImage'
import FeedUnreadCounter from './FeedUnreadCounter'

class FeedContracted extends React.PureComponent {

  constructor (props) {
    super(props)
    this.props = props

    const dim = Dimensions.get('window')
    this.screenWidth = dim.width
    this.margin = this.screenWidth * 0.05
    this.cardWidth = this.screenWidth < 500 ?
      this.screenWidth - this.margin * 2 :
      (this.screenWidth - this.margin * 3) / 2
    this.screenHeight = dim.height

    this.cardHeight = this.screenWidth < 500 ?
      this.cardWidth / 2 :
      this.cardWidth

    this.currentX = this.props.xCoord || 0
    this.currentY = this.props.yCoord || 0

    this.initialiseAnimations()
  }

  initialiseAnimations () {
    const {
      and,
      block,
      call,
      cond,
      eq,
      event,
      interpolate,
      neq,
      or,
      set,
      startClock,
      stopClock,
      timing,
      Clock,
      Extrapolate,
      Value
    } = Animated
    this.gestureState = new Value(-1)
    const clock = new Clock()
    this.onStateChange = event([{
      nativeEvent: {
        state: this.gestureState,
      },
    }])

    const runScaleTimer = (clock, gestureState) => {
      const state = {
        finished: new Value(0),
        position: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
      }

      const config = {
        duration: 150,
        toValue: new Value(-1),
        easing: Easing.inOut(Easing.ease),
      }

      return block([
        cond(and(eq(gestureState, State.BEGAN), neq(config.toValue, 1)), [
          set(state.finished, 0),
          set(state.time, 0),
          set(state.frameTime, 0),
          set(config.toValue, 1),
          startClock(clock),
          call([], this.onPress)
        ]),
        cond(and(or(eq(gestureState, State.END), eq(gestureState, State.FAILED)), neq(config.toValue, 0)), [
          set(state.finished, 0),
          set(state.time, 0),
          set(state.frameTime, 0),
          set(config.toValue, 0),
          startClock(clock),
        ]),
        timing(clock, state, config),
        cond(state.finished, stopClock(clock)),
        cond(and(eq(gestureState, State.END), state.finished)),
        interpolate(state.position, {
          inputRange: [0, 1],
          outputRange: [1, 0.95],
          extrapolate: Extrapolate.CLAMP,
        })
      ])
    }
    this._scale = runScaleTimer(clock, this.gestureState)
  }

  onPress = (e) => {
    this.imageView.measure(this.measured)
  }

  measured = (x, y, width, height, px, py) => {
    // at the moment when it's measured, the feed is scaled by 0.95
    const ratio = this.cardWidth / width
    const widthDiff = width * ratio - width
    const heightDiff = height * ratio - height
    this.currentX = px - widthDiff / 2
    this.currentY = py - heightDiff / 2
    this.props.selectFeed(this)
  }

  render = () => {
    // console.log('Render feed ' +
    //   this.props.feedTitle + ' ' +
    //   (this.state.isSelected ? 'expanded!' : 'contracted'))

    const {
      coverImageDimensions,
      coverImagePath,
      favicon,
      feedTitle,
      feedColor,
      feedDescription,
      feedId,
      feedOriginalId,
      numUnread,
      numRead,
      readingTime,
      readingRate
    } = this.props
    const textStyles = {
      color: 'white',
      fontFamily: 'IBMPlexMono-Light',
      textAlign: 'left'
    }

    console.log("Rendering " + feedTitle)

    const bold = {
      fontFamily: 'IBMPlexMono-Bold',
      color: hslString(feedColor, 'desaturated')
    }
    const italic = {
      fontFamily: 'IBMPlexMono-LightItalic'
    }

    const shadowStyle = {
      shadowColor: 'black',
      shadowRadius: 10,
      shadowOpacity: 0.3,
      shadowOffset: {
        width: 0,
        height: 5
      }
    }

    return (
      <TapGestureHandler
        onHandlerStateChange={this.onStateChange}
      >
        <Animated.View
          style={{
            flex: 1,
            height: this.cardHeight,
            width: this.cardWidth,
            marginBottom: this.margin,
            marginRight: (this.props.index % 2 === 0 && this.screenWidth > 500) ?
              this.margin :
              0,
            overflow: 'visible',
            transform: [
              {
                scaleX: this._scale,
                scaleY: this._scale
              }
            ]
          }}
          ref={c => this.outerView = c}
        >
          <View
            style={{
              height: this.cardHeight,
              width: this.cardWidth,
              borderRadius: 16,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              backgroundColor: hslString(feedColor, 'desaturated'),
              position: 'relative',
              overflow: 'visible',
              ...shadowStyle
          }}>
            <View
              ref={c => this.imageView = c}
              style={{
                height: '100%',
                width: '100%',
                borderRadius: 16,
                overflow: 'hidden'
            }}>
              <FeedCoverImage
                feedColor={this.props.feedColor}
                feedId={this.props.feedId}
                coverImageId={this.props.coverImageId}
                cachedCoverImageId={this.props.cachedCoverImageId}
                coverImageDimensions={this.props.coverImageDimensions}
                setCachedCoverImage={this.props.setCachedCoverImage}
                width={this.screenWidth}
                height={this.screenHeight * 0.5} />
            </View>
            <View style={{
              // borderTopLeftRadius: 19,
              // borderTopRightRadius: 19,
              // height: cardWidth / 2,
              width: '100%',
              height: '100%',
              borderRadius: 16,
              // paddingTop: this.margin * .5,
              paddingLeft: this.margin,
              paddingRight: this.margin,
              paddingBottom: this.margin,
              position: 'absolute',
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
              // justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
              <Text style={{
                ...textStyles,
                flexWrap: 'wrap',
                fontFamily: 'IBMPlexSansCond-Bold',
                fontSize: 24
              }}>{feedTitle}</Text>
              <Text style={{
                ...textStyles,
                fontFamily: 'IBMPlexMono-Light',
                fontSize: 16
              }}>{numUnread} unread</Text>
            </View>
          </View>
        </Animated.View>
      </TapGestureHandler>
    )
  }
}

export default FeedContracted

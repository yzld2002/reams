import React from 'react'
import FeedItemContainer from '../containers/FeedItem.js'
import OnboardingContainer from '../containers/Onboarding.js'
import {View} from 'react-native'
import SwipeableViews from './SwipeableViews'

const BUFFER_LENGTH = 1

class ItemCarousel extends React.Component {
  shouldComponentUpdate (nextProps, nextState) {
    // don't update if the items haven't changed (unread <> saved)
    // AND (nextProps.index is the same as incomingIndex
    // (ie the index we just moved to)
    // OR if nextProps.index is the same as the index we're currently at)
    if (this.incomingIndex === null) {
      return nextProps.index !== this.props.index ||
        nextProps.displayMode !== this.props.displayMode
    } else {
      return nextProps === null ||
        nextProps.index !== this.incomingIndex ||
        nextProps.displayMode !== this.props.displayMode
    }
  }

  render () {
    if (this.props.numItems > 0 || this.props.isOnboarding) {
      return <SwipeableViews
        overscanSlideAfter={BUFFER_LENGTH}
        overscanSlideBefore={BUFFER_LENGTH}
        slideRenderer={this.renderSlide.bind(this)}
        onChangeIndex={this.onChangeIndex.bind(this)}
        slideCount={this.props.isOnboarding ? 13 : this.props.numItems}
        index={this.props.index}
      />
    } else {
      return null
    }
    // return <View></View>
  }

  onChangeIndex (index, lastIndex) {
    // workaround for a weird bug
    if (index % 1 !== 0) {
      return
    }
    this.incomingIndex = index
    this.props.updateCurrentIndex(index, lastIndex, this.props.isOnboarding)
  }

  renderSlide ({key, index}) {
    if (this.props.isOnboarding) {
      return <OnboardingContainer
        index={index}
        key={index}
      />
    }
    if (index >= 0 && index < this.props.numItems) {
      return <FeedItemContainer
        index={index}
        key={index}
      />
    }
  }
}

export default ItemCarousel
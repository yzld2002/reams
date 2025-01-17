import { ItemType } from '../store/items/types'
import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import ItemsScreenOnboarding from './ItemsScreenOnboarding'
import {
  ActionSheetIOS,
  Animated,
  Dimensions,
  Image,
  Text,
  View
} from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import TextButton from './TextButton'
import SwipeableViews from './SwipeableViews'
import TopBars from './TopBars'
import FeedExpandedContainer from '../containers/FeedExpanded'
import ButtonsContainer from '../containers/Buttons.js'
import ViewButtonsContainer from '../containers/ViewButtons.js'
import { textInfoStyle, textInfoBoldStyle } from '../utils/styles'
import { hslString } from '../utils/colors'
import { getClampedScrollAnim, onScrollEnd, setClampedScrollListener, setScrollListener } from '../utils/animation-handlers'
import { fontSizeMultiplier } from '../utils'
import BackButton from './BackButton'
import {STATUS_BAR_HEIGHT} from './TopBar'
import EmptyCarousel from './EmptyCarousel'

export const BUFFER_LENGTH = 5

// a kind of memoisation, but not for performance reasons
// persisting the buffered items makes it easier to decorate
// them with clampedScrollAnims
let bufferedItems

const getBufferedItems  = (items, index, displayMode, feeds, includeMercury) => {
  const bufferStart = index === 0 ? index : index - 1
  const bufferEnd = index + BUFFER_LENGTH > items.length - 1 ?
    items.length :
    index + BUFFER_LENGTH + 1
  const buffered = items.slice(bufferStart, bufferEnd)
  const mapItem = item => ({
    _id: item._id,
    hasLoadedMercuryStuff: item.hasLoadedMercuryStuff
  })
  if (!bufferedItems || JSON.stringify(buffered.map(mapItem)) !==
    JSON.stringify(bufferedItems.map(mapItem))) {
    bufferedItems = buffered
  }
  if (displayMode === ItemType.saved) {
    return bufferedItems
  } else {
    return bufferedItems.map(bi => {
      const feed = feeds && feeds.length > 0 && feeds.find(f => f._id === bi.feed_id)
      return {
        ...bi,
        isFeedMercury: feed && feed.isMercury
      }
    })
  }
}

class ItemCarousel extends React.Component {
  constructor (props) {
    super(props)
    this.props = props

    this.index = -1,
    this.items = []
    this.bufferIndex = -1
    this.selectedText = undefined

    // this is an intermediate cache of clampedScrollAnims
    // once we have one for each bufferedItem, we put them into state
    // so that we can pass them to the TopBars and Buttons
    this.clampedScrollAnims = {}

    this.state = {
      panAnim: new Animated.Value(0)
    }

    this.onChangeIndex = this.onChangeIndex.bind(this)
    this.updateCarouselIndex = this.updateCarouselIndex.bind(this)
    this.openFeedModal = this.openFeedModal.bind(this)
    this.onTextSelection = this.onTextSelection.bind(this)
    this.launchBrowser = this.launchBrowser.bind(this)
    this.showShareSheet = this.showShareSheet.bind(this)
    this.setPanAnim = this.setPanAnim.bind(this)
    this.setScrollAnim = this.setScrollAnim.bind(this)
    this.setClampedScrollAnimSetterAndListener = this.setClampedScrollAnimSetterAndListener.bind(this)
    this.setScrollAnimSetterAndListener = this.setScrollAnimSetterAndListener.bind(this)
    this.setBufferIndexChangeListener = this.setBufferIndexChangeListener.bind(this)
  }

  // static getDerivedStateFromProps (props, state) {
  //   if ()
  //   return {
  //     index: props.index,
  //     bufferedItems: getBufferedItems(props.items, props.index),
  //     bufferIndex: props.index === 0 ? 0 : 1
  //   }
  // }

  _stringifyBufferedItems (items, index, displayMode, feeds, includeMercury = false) {
    return JSON
    .stringify(getBufferedItems(items, index, displayMode, feeds)
      .map(item => includeMercury ? {
        _id: item._id,
        hasLoadedMercuryStuff: item.hasLoadedMercuryStuff
      } : item._id))
  }

  shouldComponentUpdate (nextProps, nextState) {
    return nextProps.displayMode !== this.props.displayMode ||
      this.state !== nextState ||
      !(
        nextProps.index > this.initialIndex - 1 &&
        nextProps.index < this.initialIndex + BUFFER_LENGTH &&
        this._stringifyBufferedItems(nextProps.items, this.props.index, this.props.displayMode, this.props.feeds, false) ===
          this._stringifyBufferedItems(this.props.items, this.props.index, this.props.displayMode, this.props.feeds, false)
      )
  }

  componentDidUpdate (prevProps, prevState) {
    this.initIndex()
    if (prevProps.items && this.props.items &&
      JSON.stringify(prevProps.items.map(item => item._id)) !==
        JSON.stringify(this.props.items.map(item => item._id))) {
      this.clampedScrollAnims = {}
    }
  }

  // shouldComponentUpdate (nextProps, nextState) {
  //   // don't update if the item type hasn't changed (unread <> saved)
  //   // or if the the items haven't changed
  //   // AND nextProps.index is within the (index + BUFFER_LENGTH)
  //   // OR if nextProps.index is the same as the index we're currently at)

  //   if (this.incomingIndex === null) {
  //     return nextProps.index !== this.props.index ||
  //       nextProps.displayMode !== this.props.displayMode
  //   } else {
  //     return nextProps === null ||
  //       nextProps.index - this.props.index >= BUFFER_LENGTH ||
  //       nextProps.displayMode !== this.props.displayMode ||
  //       _stringifyBufferedItems(nextProps.items, nextProps.initialIndex) !==
  //         _stringifyBufferedItems(this.props.items, this.props.initialIndex)
  //   }
  // }

  initIndex () {
    this.index = this.initialIndex = this.props.index
    this.bufferIndex = this.index === 0 ? 0 : 1
  }

  incrementIndex () {
    this.setIndex(this.index + 1, this.bufferIndex + 1)
  }

  decrementIndex () {
    this.setIndex(this.index - 1, this.bufferIndex - 1)
  }

  updateCarouselIndex (bufferIndex) {
    const diff = bufferIndex - this.bufferIndex
    this.setIndex(this.index + diff, bufferIndex)
  }

  setIndex (index, bufferIndex) {
    this.incomingIndex = index
    const lastIndex = this.index
    this.index = index
    this.bufferIndex = bufferIndex
    this.selectedText = undefined
    this.bufferIndexChangeListener && this.bufferIndexChangeListener(this.bufferIndex)
    console.log('setIndex', this.index, this.bufferIndex)
    this.props.updateCurrentIndex(index, lastIndex, this.props.displayMode, this.props.isOnboarding)
  }

  decorateItems (items) {
    const { feeds, feedsLocal } = this.props
    const hasCachedFeedIcon = (feedId) => feedsLocal.find(f => f._id === feedId) &&
      feedsLocal.find(f => f._id === feedId).hasCachedIcon
    const feedIconDimensions = (feedId) => feedsLocal.find(f => f._id === feedId) &&
      feedsLocal.find(f => f._id === feedId).cachedIconDimensions
    // const feedColor = (feedId) => feeds.find(f => f._id === feedId) &&
    //   feeds.find(f => f._id === feedId).color
    return items.map(item => ({
      ...item,
      hasCachedFeedIcon: hasCachedFeedIcon(item.feed_id),
      feedIconDimensions: feedIconDimensions(item.feed_id),
      // feedColor: feedColor(item.feed_id)
    }))
  }

  openFeedModal () {
    const { navigation } = this.props
    const item = this.bufferedItems[this.bufferIndex]
    navigation.push('ModalWithGesture', {
      childView: <FeedExpandedContainer
          feedId={item.feed_id}
          close={() => navigation.navigate('Items')}
          navigation={navigation}
        />
    })
  }

  onSavePress (isSaved) {
    const item = this.bufferedItems[this.bufferIndex]
    this.props.isOnboarding || this.props.setSaved(item, isSaved)
  }

  showViewButtons (areVisible) {
    const item = this.props.items[this.bufferIndex]
  }

  showShareSheet (isVisible) {
    const item = this.bufferedItems[this.bufferIndex]
    if (this.props.isOnboarding || !item) return
    ActionSheetIOS.showShareActionSheetWithOptions({
        url: item.url,
        message: this.selectedText,
        title: item.title
      },
      (error) => {
        console.error(error)
      },
      (success, method) => {
      }
    )
  }

  async launchBrowser () {
    const item = this.bufferedItems[this.bufferIndex]
    try {
      await InAppBrowser.isAvailable()
      InAppBrowser.open(item.url, {
        // iOS Properties
        dismissButtonStyle: 'close',
        preferredBarTintColor: hslString('rizzleBG'),
        preferredControlTintColor: hslString('rizzleText'),
        animated: true,
        modalEnabled: true,
        // modalPresentationStyle: "popover",
        // readerMode: true,
        enableBarCollapsing: true,
      })
    } catch (error) {
      console.log('openLink', error)
    }
  }

  setPanAnim (panAnim) {
    this.setState({ panAnim })
  }

  setScrollAnim (scrollAnim) {
    if (this.clampedScrollAnimSetter) {
      this.clampedScrollAnimSetter(getClampedScrollAnim(scrollAnim))
    }
    if (this.scrollAnimSetter) {
      this.scrollAnimSetter(scrollAnim)
    }
  }

  onScrollEnd (scrollOffset) {
    // console.log('Scroll end')
    onScrollEnd(scrollOffset)
    // const item = bufferedItems.find(bi => bi._id === item_id)
    // if (item) {
    //   item.scrollManager.onScrollEnd(scrollOffset)
    // }
  }

  onTextSelection (selectedText) {
    this.selectedText = selectedText
  }

  setClampedScrollAnimSetterAndListener (clampedScrollAnimSetter, clampedScrollAnimListener) {
    this.clampedScrollAnimSetter = clampedScrollAnimSetter
    setClampedScrollListener(clampedScrollAnimListener)
  }

  setScrollAnimSetterAndListener (scrollAnimSetter, scrollAnimListener) {
    this.scrollAnimSetter = scrollAnimSetter
    setScrollListener(scrollAnimListener)
  }

  setBufferIndexChangeListener (bufferIndexChangeListener) {
    this.bufferIndexChangeListener = bufferIndexChangeListener
  }

  render () {
    const {
      displayMode,
      feeds,
      isItemsOnboardingDone,
      isOnboarding,
      navigation,
      numItems,
      setPanAnim,
      toggleDisplayMode,
      items,
      index
    } = this.props

    this.initIndex()

    this.bufferedItems = getBufferedItems(items, index, displayMode, feeds)
    // this.bufferIndexChangeListener && this.bufferIndexChangeListener(this.bufferIndex)

    if (numItems > 0 || isOnboarding) {
      // do something with setPanAnim on the ToolbarContainer
      return (
        <Fragment>
          <SwipeableViews
            index={index === 0 ? 0 : 1}
            items={this.bufferedItems}
            isOnboarding={isOnboarding}
            navigation={navigation}
            setPanAnim={this.setPanAnim}
            setScrollAnim={this.setScrollAnim}
            onScrollEnd={this.onScrollEnd}
            onTextSelection={this.onTextSelection}
            updateCarouselIndex={this.updateCarouselIndex}
          />
          { !isItemsOnboardingDone &&
            !isOnboarding &&
            numItems > 0 &&
            <ItemsScreenOnboarding /> }
          <TopBars
            items={this.decorateItems(this.bufferedItems)}
            navigation={navigation}
            numItems={numItems}
            index={index}
            bufferIndex={this.bufferIndex}
            openFeedModal={this.openFeedModal}
            panAnim={this.state.panAnim}
            setClampedScrollAnimSetterAndListener={this.setClampedScrollAnimSetterAndListener}
            setScrollAnimSetterAndListener={this.setScrollAnimSetterAndListener}
            setBufferIndexChangeListener={this.setBufferIndexChangeListener}
          />
          <ButtonsContainer
            bufferStartIndex={ index === 0 ? index : index - 1 }
            bufferedItems={this.bufferedItems}
            panAnim={this.state.panAnim}
            showViewButtons={this.showViewButtons}
            showShareSheet={this.showShareSheet}
            setSaved={this.props.setSaved}
            toggleViewButtons={this.props.toggleViewButtons}
            launchBrowser={this.launchBrowser}
            toggleMercury={this.props.toggleMercury}
          />
          <ViewButtonsContainer />
        </Fragment>
      )
    } else {
      return <EmptyCarousel
        displayMode={displayMode}
        navigation={navigation}
        toggleDisplayMode={toggleDisplayMode}
      />
    }
  }

  onChangeIndex (index, lastIndex) {
    // // workaround for a weird bug
    // if (index % 1 !== 0) {
    //   return
    // }
    this.incomingIndex = index
    this.props.updateCurrentIndex(index, lastIndex, this.props.displayMode, this.props.isOnboarding)
  }

  // cacheCoverImageComponent
}

export default ItemCarousel

ItemCarousel.propTypes = {
  // from parent
  navigation: PropTypes.object,
  styles: PropTypes.object,
  // from container
  numItems: PropTypes.number,
  index: PropTypes.number,
  items: PropTypes.array,
  feeds: PropTypes.array,
  feedsLocal: PropTypes.array,
  displayMode: PropTypes.string,
  isItemsOnboardingDone: PropTypes.bool,
  isOnboarding: PropTypes.bool,
  toggleViewButtons: PropTypes.func
}

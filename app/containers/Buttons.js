import { connect } from 'react-redux'
import Buttons from '../components/Buttons.js'
import {
  itemsUpdateCurrentIndex,
  itemSaveItem,
  itemUnsaveItem,
  toggleDisplayedItems
} from '../redux/actions/items.js'

const mapStateToProps = (state) => {
  const items = state.itemsMeta.display === 'unread' ?
    (feedFilter ?
      state.itemsUnread.filter(item => item.feed_id === feedFilter) :
      state.itemsUnread) :
    state.itemsSaved
  const index = state.config.isOnboarding ?
    state.config.onboardingIndex :
    state.itemsMeta.display === 'unread' ?
      state.itemsMeta.index :
      state.itemsMeta.savedIndex
  const currentItem = items.length > 1 ? items[index] : null
  const prevItem = index > 0 ? items[index - 1] : null
  const nextItem = index < items.length - 1 ? items[index + 1] : null
  const numItems = state.config.isOnboarding ?
    state.config.onboardingLength :
    items.length
  return {
    prevItem,
    currentItem,
    nextItem,
    numItems,
    index,
    isCurrentItemSaved: currentItem && currentItem.isSaved,
    showMercuryContent: currentItem && currentItem.showMercuryContent,
    isCurrentItemMercuryButtonEnabled: currentItem && currentItem.content_mercury,
    toolbar: state.toolbar,
    displayMode: state.itemsMeta.display,
    decoratedCount: state.itemsMeta.decoratedCount,
    visible: state.ui.itemButtonsVisible
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateCurrentIndex: (index) => dispatch(itemsUpdateCurrentIndex(index)),
    toggleSaved: (item) => {
      if (item) {
        item.isSaved ? dispatch(itemUnsaveItem(item)) : dispatch(itemSaveItem(item))
      }
    },
    toggleDisplay: () => dispatch(toggleDisplayedItems()),
    toggleMercury: (item) => {
      if (item) {
        dispatch({
          type: 'ITEM_TOGGLE_MERCURY',
          item
        })
      }
    }
  }
}

let ButtonsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Buttons)

export default ButtonsContainer

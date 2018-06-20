import { connect } from 'react-redux'
import Buttons from '../components/Buttons.js'
import {
  itemsUpdateCurrentIndex,
  itemSaveItem,
  itemUnsaveItem,
  toggleDisplayedItems
} from '../redux/actions/items.js'

const mapStateToProps = (state) => {
  const items = state.items.display === 'unread' ? state.items.items : state.items.saved
  const index = state.config.isOnboarding ?
    state.config.onboardingIndex :
    state.items.display === 'unread' ? 
      state.items.index : 
      state.items.savedIndex
  const item = items[index]
  const numItems = state.config.isOnboarding ? 
    state.config.onboardingLength :
    items.length
  return {
    item,
    numItems,
    index,
    isSaved: item && item.isSaved,
    showMercuryContent: item && item.showMercuryContent,
    isMercuryButtonEnabled: item && item.content_mercury,
    toolbar: state.toolbar,
    displayMode: state.items.display,
    decoratedCount: state.items.decoratedCount,
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

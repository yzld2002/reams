import { connect } from 'react-redux'
import TopBar from '../components/TopBar.js'
import { itemsUpdateCurrentIndex } from '../redux/actions/items.js'
import {
  getUnreadItems,
  getSavedItems
} from '../redux/selectors/items'

const mapStateToProps = (state) => {
  const items = state.itemsMeta.display === 'unread' ?
    getUnreadItems(state) :
    getSavedItems(state)
  const index = state.itemsMeta.display === 'unread' ?
    state.itemsMeta.index :
    state.itemsMeta.savedIndex
  const currentItem = (items && items.length > 1) ? items[index] : null
  const prevItem = (items && index > 0) ? items[index - 1] : null
  const nextItem = (items && index < items.length - 1) ? items[index + 1] : null
  return {
    prevItem,
    currentItem,
    nextItem,
    toolbar: state.toolbar,
    displayMode: state.itemsMeta.display
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleViewButtons: () => dispatch({
      type: 'UI_TOGGLE_VIEW_BUTTONS'
    }),
    showItemButtons: () => dispatch({
      type: 'UI_SHOW_ITEM_BUTTONS'
    }),
    hideAllButtons: () => dispatch({
      type: 'UI_HIDE_ALL_BUTTONS'
    }),
  }
}

let TopBarContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(TopBar)

export default TopBarContainer

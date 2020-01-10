import { InteractionManager } from 'react-native'
import { call, put, select } from 'redux-saga/effects'

import { isInflated, deflateItem, inflateStyles } from '../../utils/item-utils'
import log from '../../utils/log'
import { getActiveItems, getDisplay, getFeedFilter, getIndex, getItems } from './selectors'

import { getItemsAS } from '../async-storage/'

export function * inflateItems (action) {
  // OK. This is complicated.
  // This saga could be triggered by a number of actions:
  // 1. ITEM_UNSAVE_ITEM - { item }
  // 2. SET_DISPLAY_MODE - { displayMode }
  // 3. ITEMS_UPDATE_CURRENT_INDEX - { index }
  // 4. init - {}
  // 5. fetchItems - { index}
  // 6. saveItem - { displayMode, saved }
  const feedFilter = yield select(getFeedFilter)
  const displayMode = yield select(getDisplay)
  const index = yield select(getIndex, displayMode)
  let items = yield select(getItems, displayMode)
  if (displayMode === 'unread' && feedFilter) {
    items = items.filter(i => i.feed_id === feedFilter)
  }
  if (items.length === 0) {
    debugger
    return
  }

  const activeItems = yield select(getActiveItems)

  try {
    let itemsToDeflate = []
    // this doesn't totally work:
    // e.g.when switching from saved to unread, items = unread,
    // but the inflated items are actually all in saved
    // I don't think it's a big deal though
    items.filter(isInflated).forEach(i => {
      if (!activeItems.find(ai => ai._id === i._id)) {
        itemsToDeflate.push(deflateItem(i))
      }
    })

    let itemsToInflate = []
    activeItems.forEach(i => {
      if (items.filter(isInflated).indexOf(i) === -1) {
        itemsToInflate.push(i)
      }
    })

    console.log(itemsToInflate)
    let inflatedItems = []
    if (itemsToInflate.length > 0) {
      inflatedItems = yield call(getItemsAS, itemsToInflate)

      // sometimes one of these is null, for reasons that I don't understand
      // so let's try returning the uninflated item and see if that helps
      // inflatedItems = inflatedItems.map((inflatedItem, index) => inflatedItem === null ?
      //   itemsToInflate[index] :
      //   inflatedItem)
      inflatedItems = inflatedItems.map((inflatedItem, index) => {
        return inflatedItem === null ?
          {
            error: true,
            _id: itemsToInflate[index]._id
          } :
          inflatedItem
      })
      const erroredItems = inflatedItems.filter(i => i.error)
      if (erroredItems.length) {
        // dispatch an ITEMS_FLATE_ERROR event
        yield put({
          type: 'ITEMS_FLATE_ERROR',
          items: erroredItems
        })
        return
      }

      // some of the item fields are mutable, i.e. they could have changed while the item was deflated
      // (right now actually just the feed color)
      inflatedItems = inflatedItems.map((inflatedItem, index) => ({
        ...inflatedItem,
        feed_color: itemsToInflate[index].feed_color || inflatedItem.feed_color
      }))
    }


    // inflatedItems = inflatedItems.map(inflateStyles)
    if (inflatedItems.length > 0 || itemsToDeflate.length > 0) {
      yield put({
        type: 'ITEMS_FLATE',
        itemsToInflate: inflatedItems,
        itemsToDeflate
      })
    }
  } catch (err) {
    log('inflateItems', err)
  }
}

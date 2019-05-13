import { InteractionManager } from 'react-native'
import { delay } from 'redux-saga'
import { call, put, select } from 'redux-saga/effects'
import { markItemRead } from '../backends'
import { deleteItemsAS } from '../async-storage'

import { getItems, getCurrentItem, getFeeds, getDisplay, getUnreadItems } from './selectors'

import log from '../../utils/log'
import { removeCachedCoverImages } from '../../utils/item-utils'

export function * markLastItemRead (action) {
  yield call(InteractionManager.runAfterInteractions)
  const display = yield select(getDisplay)
  if (display !== 'unread' || typeof(action.lastIndex) === 'undefined') {
    return
  }
  const lastIndex = action.lastIndex
  const unreadItems = yield select(getItems)
  const item = unreadItems[lastIndex]
  yield call(InteractionManager.runAfterInteractions)
  yield put ({
    type: 'ITEM_MARK_READ',
    item
  })
}

export function * clearReadItems () {
  yield call(InteractionManager.runAfterInteractions)
  const items = yield select(getUnreadItems)
  const displayMode = yield select(getDisplay)
  const readItems = items.filter(item => !!item.readAt)

  yield call(InteractionManager.runAfterInteractions)
  try {
    yield deleteItemsAS(readItems)
  } catch(err) {
    log('deleteItemsAS', err)
  }

  yield call(InteractionManager.runAfterInteractions)
  yield put({
    type: 'ITEMS_CLEAR_READ_SUCCESS'
  })
  // now reset the index to 0
  // (this will also inflate the relevant items)
  yield call(InteractionManager.runAfterInteractions)
  yield put({
    type: 'ITEMS_UPDATE_CURRENT_INDEX',
    index: 0,
    displayMode
  })

  removeCachedCoverImages(readItems)
}
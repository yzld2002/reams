import { call, put, takeEvery, select } from 'redux-saga/effects'
import { getUid } from './selectors'
import { REHYDRATE } from 'redux-persist'

import { setUid, setDb } from '../firestore/'

import { decorateItems } from './decorate-items'
import { fetchItems2 } from './fetch-items'
import { markLastItemRead, clearReadItems } from './mark-read'
import { appActive, appInactive, currentItemChanged, screenActive, screenInactive } from './reading-timer'
import { saveExternalUrl } from './external-items'
import { rehydrateItems } from './rehydrate-items'
import { inflateItems } from './inflate-items'
import { saveItem } from './save-item'
import { executeRemoteActions } from './remote-action-queue'
import { subscribeToFeed, seedFeeds, inflateFeeds } from './add-feed'
import { initialConfig } from './initial-config'

// let rehydrated = false
// let checkedBuckets = false
// function * waitForBoth (action) {
//   console.log(action)
//   switch (action.type) {
//     case REHYDRATE:
//       rehydrated = true
//       break
//     case 'UI_FINISHED_CHECKING_BUCKETS':
//       checkedBuckets = true
//       break
//   }

//   if (rehydrated && checkedBuckets) {
//     yield fetchItems2()
//     rehydrated = false
//     checkedBuckets = false
//   }
// }

function * init (getFirebase, action) {
  if (action.key !== 'primary') return
  const uid = yield select(getUid)

  setDb(getFirebase().firestore())
  setUid(uid)

  yield call(initialConfig)
  yield call(rehydrateItems)
  yield put({
    type: 'ITEMS_CLEAR_READ'
  })
  yield call(fetchItems2)
  yield call(executeRemoteActions)
  yield call(inflateFeeds)
}

function setFirebaseUid (action) {
  setUid(action.uid)
}

export function * updateCurrentIndex (getFirebase) {
  yield takeEvery(REHYDRATE, init, getFirebase)
  yield takeEvery('ITEMS_FETCH_ITEMS', fetchItems2)
  yield takeEvery('ITEMS_UPDATE_CURRENT_INDEX', inflateItems)
  yield takeEvery('ITEMS_UPDATE_CURRENT_INDEX', markLastItemRead)
  yield takeEvery('SAVE_EXTERNAL_URL', saveExternalUrl)
  yield takeEvery('ITEM_SAVE_ITEM', saveItem)
  yield takeEvery('FEEDS_ADD_FEED', subscribeToFeed)
  yield takeEvery('FEEDS_ADD_FEED_SUCCESS', fetchItems2)
  yield takeEvery('ITEMS_FETCH_DATA_SUCCESS', decorateItems)
  yield takeEvery('ITEMS_CLEAR_READ', clearReadItems)
  yield takeEvery('USER_SET_UID', clearReadItems)

  // reading timer
  yield takeEvery('ITEMS_UPDATE_CURRENT_INDEX', currentItemChanged)
  yield takeEvery('STATE_ACTIVE', appActive)
  yield takeEvery('STATE_INACTIVE', appInactive)
  yield takeEvery('NAVIGATION_ITEMS_SCREEN_FOCUS', screenActive)
  yield takeEvery('NAVIGATION_ITEMS_SCREEN_BLUR', screenInactive)
}

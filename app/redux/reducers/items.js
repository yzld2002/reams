import {REHYDRATE} from 'redux-persist'
import {createItemStyles} from '../../utils/createItemStyles'

export const initialState = {
  items: [],
  saved: [],
  index: 0,
  savedIndex: 0,
  display: 'unread', // currently 'unread' || 'saved'
  decoratedCoung: 0
}

export function itemsHasErrored (state = false, action) {
  switch (action.type) {
    case 'ITEMS_HAS_ERRORED':
      return action.hasErrored
    default:
      return state
  }
}

export function items (state = initialState, action) {
  let items = []
  let newItems = []
  let saved = []
  let savedItem = {}
  let newState = {}
  const key = state.display === 'unread' ? 'items' : 'saved'
  const indexKey = state.display === 'unread' ? 'index' : 'savedIndex'
  const currentItem = state[key][state[indexKey]] || 0

  switch (action.type) {
    case REHYDRATE:
      // workaround to make up for slideable bug
      let incoming = action.payload ? action.payload.items : null
      if (incoming) {
        console.log('REHYDRATE!' + action.payload.items)
        return {
          ...state,
          ...incoming,
          index: incoming.index < 0 ? 0 : incoming.index,
          savedIndex: incoming.savedIndex < 0 ? 0 : incoming.savedIndex
        }
      }
      return { ...state }

    case 'UPDATE_ITEM':
      items = state[key]
      newItems = items.map(item =>
        item._id === action.item._id
          ? action.item
          : item
      )
      return {
        ...state,
        key: newItems
      }

    case 'INSERT_ITEM':
      if (action.item._id === '9999999999') {
        return state
      }
      return {
        ...state,
        items: [
          action.item,
          ...state.items
        ]
      }

    case 'ITEMS_FETCH_DATA_SUCCESS':
      items = action.items
        .map(addStylesIfNecessary)

      let index = 0
      if (currentItem) {
        items.forEach((item, i) => {
          if (item._id === currentItem._id) {
            index = i
          }
        })
      }
      return {
        ...state,
        items,
        index
      }

    case 'ITEM_MARK_READ_SUCCESS':
      items = state[key]
      items[action.index].readAt = Date.now()
      return {
        ...state,
        items
      }

    case 'ITEMS_UPDATE_CURRENT_INDEX':
      if (state.display === 'unread') {
        newState.index = action.index
      } else {
        newState.savedIndex = action.index
      }
      return {
        ...state,
        ...newState
      }

    case 'ITEMS_MARK_ALL_READ':
      const feedId = action.feedId
      const currentItem = state.items[state.index]
      items = [ ...state.items ].filter((item) => {
        return item.feed_id !== action.feedId &&
          item._id !== currentItem._id
      })
      let newIndex
      items.forEach((item, index) => {
        if (item._id === currentItem._id) {
          newIndex = index
        }
      })
      return {
        ...state,
        items,
        newIndex
      }

    case 'ITEM_TOGGLE_MERCURY':
      items = [ ...state.items ]
      const item = items.find((item) => item._id === action.item._id)
      if (item.content_mercury) {
        item.showMercuryContent = !item.showMercuryContent
      }
      return {
        ...state,
        items
      }

    case 'ITEM_SAVE_ITEM':
      items = [ ...state.items ]
      saved = [ ...state.saved ]
      savedItem = items.find((item) => item._id === action.item._id)
      savedItem.isSaved = true
      saved.push({
        ...savedItem,
        savedAt: Date.now()
      })
      return {
        ...state,
        items,
        saved
      }

    case 'ITEM_SAVE_EXTERNAL_ITEM':
      savedItem = addStylesIfNecessary(action.item)
      savedItem.isSaved = true
      saved.push({
        ...savedItem,
        savedAt: Date.now()
      })
      return {
        ...state,
        saved
      }

    case 'ITEM_UNSAVE_ITEM':
      items = [ ...state.items ]
      let savedIndex = state.savedIndex
      savedItem = state.saved.find((item) => item._id === action.item._id)
      saved = state.saved.filter((item) => item._id !== action.item._id)
      savedItem = items.find((item) => item._id === action.item._id)
      if (savedItem) savedItem.isSaved = false
      if (savedIndex > saved.length - 1) {
        savedIndex = saved.length - 1
      }
      return {
        ...state,
        items,
        saved,
        savedIndex
      }

      newState = { ...state }
      newState[indexKey] = action.index
      return newState

    case 'ITEMS_KEEP_CURRENT_ITEM_UNREAD':
      newItems = state.items
      newItems[state.index].keepUnread = true
      return {
        ...state,
        items: newItems
      }

    case 'ITEM_DECORATION_SUCCESS':
      const testAndDecorate = (item) => {
        if (item._id === action.item._id) {
          item =  addMercuryStuffToItem(item, action.mercuryStuff)
          return addCoverImageToItem(item, action.imageStuff)
        } else {
          return item
        }
      }

      items = state.items.map(testAndDecorate).map(addStylesIfNecessary)
      saved = state.saved.map(testAndDecorate).map(addStylesIfNecessary)
      return {
        ...state,
        items,
        saved
      }

    case 'ITEM_DECORATION_PROGRESS':
      return {
        ...state,
        decoratedCount: action.decoratedCount
      }

    case 'TOGGLE_DISPLAYED_ITEMS':
      const display = state.display === 'unread' ? 'saved' : 'unread'
      return {
        ...state,
        display
      }

    case 'UPDATE_CURRENT_ITEM_TITLE_FONT_SIZE':
      items = state[key]
      newItems = items.map(item => {
        if (item._id === action.item._id) {
          item.styles.title.fontSize = action.fontSize
          item.styles.title.lineHeight = action.fontSize
          item.styles.title.fontResized = true
        }
        return item
      })
      return {
        ...state,
        key: items
      }

    case 'UPDATE_CURRENT_ITEM_TITLE_FONT_RESIZED':
      items = state[key]
      newItems = items.map(item => {
        if (item._id === action.item._id) {
          item.styles.title.fontResized = true
        }
        return item
      })
      return {
        ...state,
        key: items
      }

    default:
      return state
  }
}

function addStylesIfNecessary (item) {
  if (item.styles && !item.styles.temporary) {
    return item
  } else {
    let styles = createItemStyles(item)
    if (item.title === 'Loading...') {
      styles.temporary = true
    }
    return {
      ...item,
      styles
    }
  }
}

function addMercuryStuffToItem (item, mercury) {
  if (item.is_external) {
    return {
      ...item,
      external_url: item.url,
      title: mercury.title,
      content_mercury: mercury.content,
      body: mercury.content,
      date_published: mercury.date_published,
      date_modified: mercury.date_published,
      author: mercury.author,
      feed_title: mercury.domain,
      banner_image: mercury.lead_image_url,
      excerpt: mercury.excerpt,
      hasLoadedMercuryStuff: true,
      showMercuryContent: true
    }
  }

  // let content = mercury.content && mercury.content.length && mercury.content.length > item.content_html.length
  //   ? mercury.content
  //   : item.body
  return {
    ...item,
    banner_image: mercury.lead_image_url,
    // body: content,
    content_mercury: mercury.content,
    excerpt: mercury.excerpt,
    hasLoadedMercuryStuff: true
  }
}

function addCoverImageToItem (item, imageStuff) {
  return {
    ...item,
    ...imageStuff
  }
}

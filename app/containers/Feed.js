import { connect } from 'react-redux'
import Feed from '../components/Feed.js'
import {getCachedImagePath} from '../utils/'

const mapStateToProps = (state, ownProps) => {
  const feedId = ownProps.feedId
  const items = state.itemsUnread
  const feedItems = items.filter(i => i.feed_id === feedId)
  const numFeedItems = feedItems.length
  const coverImageItem = feedItems.find(item => item.banner_image)
  const coverImagePath = coverImageItem ?
    getCachedImagePath(coverImageItem) :
    null
  const coverImageDimensions = coverImageItem ?
    coverImageItem.imageDimensions :
    null
  return {
    ...ownProps,
    numFeedItems,
    coverImagePath,
    coverImageDimensions
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    filterItems: (id) => dispatch({
      type: 'CONFIG_SET_FEED_FILTER',
      feedFilter: id
    }),
    markAllRead: (id) => dispatch({
      type: 'FEED_MARK_READ',
      id
    }),
    clearReadItems: () => dispatch({
      type: 'ITEMS_CLEAR_READ'
    }),
    unsubscribe: (id) => dispatch({
      type: 'FEEDS_REMOVE_FEED',
      id
    })
  }
}

let FeedContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Feed)

export default FeedContainer

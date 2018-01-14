const initialState = {
  isVisible: true,
  message: '',
  scrollOwner: null,
  scrollDiff: 0
}

export function toolbar (state = initialState, action) {
  switch (action.type) {
    case 'ITEMS_IS_LOADING':
      return {
        ...state,
        message: action.isLoading
          ? 'Loading Items' + (action.numItems
            ? ` (${action.numItems})`
            : '')
          : ''
      }
    case 'SCROLL_HANDLER_ATTACHED': {
      return {
        ...state,
        scrollOwner: action.owner
      }
    }

    // case 'ITEM_SCROLL_ZERO':
    //   return {
    //     ...toolbar,
    //     scrollDiff: action.diff
    //   }
    // case 'ITEM_DID_SCROLL_UP':
    //   return {
    //     ...toolbar,
    //     scrollDiff: action.diff,
    //     scrollOffset: action.offset
    //   }
    // case 'ITEM_DID_SCROLL_DOWN':
    //   return {
    //     ...toolbar,
    //     scrollDiff: action.diff,
    //     scrollOffset: action.offset
    //   }
    default:
      return state
  }
}

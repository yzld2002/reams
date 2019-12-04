const initialState = {
  uid: ''
}

export function user (state = initialState, action) {
  switch (action.type) {
    case 'USER_SET_UID':
      return {
        ...state,
        uid: action.uid
      }

    case 'USER_SET_DETAILS':
      // if (!action.details) return state
      return {
        ...state,
        displayName: action.details && action.details.displayName,
        email: action.details && action.details.email,
        uid: action.details && action.details.uid
      }

    case 'USER_SET_SIGN_IN_EMAIL':
      return {
        ...state,
        signInEmail: action.email
      }

    default:
      return state
  }
}

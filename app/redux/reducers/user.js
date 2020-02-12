const initialState = {
  displayName: '',
  email: '',
  password: '',
  signInEmail: '',
  uid: '',
  username: ''
}

export function user (state = initialState, action) {
  switch (action.type) {
    case 'USER_SET_UID':
      return {
        ...state,
        uid: action.uid
      }

    case 'USER_SET_DETAILS':
      const { details } = action
      if (!details) {
        return state
      } else {
        return {
          ...state,
          ...details
        }
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

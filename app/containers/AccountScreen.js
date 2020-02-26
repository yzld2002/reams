import { connect } from 'react-redux'
import { SET_BACKEND, SET_SIGN_IN_EMAIL, UNSET_BACKEND } from '../store/config/types'
import AccountScreen from '../components/AccountScreen.js'

const mapStateToProps = (state) => {
  return {
    user: state.user,
    backend: state.config.backend
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    showModal: (modalProps) => dispatch({
      type: 'UI_SHOW_MODAL',
      modalProps
    }),
    setBackend: (backend, credentials) => dispatch({
      type: SET_BACKEND,
      backend,
      credentials
    }),
    unsetBackend: () => dispatch({
      type: UNSET_BACKEND
    }),
    setSignInEmail: (email) => dispatch({
      type: SET_SIGN_IN_EMAIL,
      email
    })
  }
}

let AccountScreenContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountScreen)

export default AccountScreenContainer

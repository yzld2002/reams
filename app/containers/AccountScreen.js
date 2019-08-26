import { connect } from 'react-redux'
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
    setBackend: (backend, accessToken) => dispatch({
      type: 'CONFIG_SET_BACKEND',
      backend,
      accessToken
    })
  }
}

let AccountScreenContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountScreen)

export default AccountScreenContainer

import { connect } from 'react-redux'
import AppStateListener from '../components/AppStateListener'

const mapStateToProps = (state) => {
  const appState = state.appState || 'inactive'
  return {
    appState
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateCurrentAppState: (state) => dispatch(updateCurrentAppState(state)),
    saveURL: (url) => dispatch({
      type: 'SAVE_EXTERNAL_URL',
      url
    })
  }
}

let AppStateListenerContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AppStateListener)

export default AppStateListenerContainer

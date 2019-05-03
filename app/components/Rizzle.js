import React, { Component } from 'react'
import { Provider } from 'react-redux'
import {
  Linking,
  StatusBar,
  View
} from 'react-native'
import DeepLinking from 'react-native-deep-linking'
import firebase from 'react-native-firebase'
import { configureStore } from '../redux/store'
import { Sentry } from 'react-native-sentry'
import SplashScreen from 'react-native-splash-screen'
import { NavigationEvents } from 'react-navigation'
import { GoogleSignin } from 'react-native-google-signin'
import AppContainer from '../containers/App.js'
import AppStateListenerContainer from '../containers/AppStateListener.js'
import ConnectionListenerContainer from '../containers/ConnectionListener.js'
import RizzleModalContainer from '../containers/RizzleModal.js'
import ActionExtensionScreen from './Action'
import { setBackend } from '../redux/backends'
import { hslString } from '../utils/colors'

export default class Rizzle extends Component {
  static defaultProps = {
    isActionExtension: false
  }

  constructor (props) {
    super(props)
    this.props = props

    this.state = {}
    this.store = null

    // const firebaseConfig = {
    //   apiKey: "AIzaSyDsV89U3hnA0OInti2aAlCVk_Ymi04-A-o",
    //   authDomain: "rizzle-base.firebaseapp.com",
    //   databaseURL: "https://rizzle-base.firebaseio.com",
    //   storageBucket: "rizzle-base.appspot.com",
    //   messagingSenderId: "801044191408"
    // }

    // is there any special reason why the store was only configured after an anonymous login?
    this.store = configureStore()

    // firebase.auth()
    //   .signInAnonymously()
    //   .then(credential => {
    //     this.store = configureStore()
    //     this.store.dispatch({
    //       type: 'USER_SET_UID',
    //       uid: credential.user.uid
    //     })
    //     this.setState({ credential })
    //   })

    Sentry.config('https://1dad862b663640649e6c46afed28a37f@sentry.io/195309').install()

    if (__DEV__) SplashScreen.hide()

    // this is a stupid hack to stop AppState firing on startup
    // which it does on the device in some circumstances
    global.isStarting = true
    setTimeout(() => {
      global.isStarting = false
    }, 5000)

    console.disableYellowBox = true
  }

  // https://www.ekreative.com/universal-linking-in-react-native-for-ios/
  componentDidMount () {
    // set up deep linking
    this.addRoutesToDeepLinking()
    Linking.addEventListener('url', this.handleUrl)

    // listen for auth changes
    this.authSubscription = firebase.auth().onAuthStateChanged((details) => {
      this.store.dispatch({
        type: 'USER_SET_DETAILS',
        details
      })
      this.setState({ details })
      console.log('Authenticated! ' + details)
    })

    // https://github.com/react-native-community/react-native-google-signin
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
      webClientId: '801044191408-utktg7miqrgg8ii16rl0i63ul0oogmu8.apps.googleusercontent.com', // client ID of type WEB for your server (needed to verify user ID and offline access)
      loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI if possible. [See docs here](https://developers.google.com/identity/sign-in/ios/api/interface_g_i_d_sign_in.html#a0a68c7504c31ab0b728432565f6e33fd)
      forceConsentPrompt: true, // [Android] if you want to show the authorization prompt at each login.
      accountName: '', // [Android] specifies an account name on the device that should be used
      // iosClientId: '<FROM DEVELOPER CONSOLE>', // [iOS] optional, if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
    })
  }

  handleUrl ({ url }) {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        DeepLinking.evaluateUrl(url)
      }
    })
  }

  addRoutesToDeepLinking () {
    DeepLinking.addScheme('https://')
    DeepLinking.addRoute('/app.rizzle.net/sign-in', (response) => {
      navigate('Account')
    })
  }

  componentWillUnmount () {
    Linking.removeEventListener('url', this.handleUrl)
    this.authSubscription()
  }

  render () {
    // if (!this.state.details) {
    //   console.log('Returning null')
    //   return null
    // }

    const component = this.props.isActionExtension ?
      <ActionExtensionScreen /> :
      (<View style={{
        flex: 1,
        backgroundColor: hslString('rizzleBG')}}>
        <RizzleModalContainer />
        <StatusBar
          barStyle='light-content'
          hidden={false} />
        <AppStateListenerContainer />
        <ConnectionListenerContainer />
        <AppContainer />
      </View>)

    return (
      <Provider store={this.store}>
        { component }
      </Provider>
    )
  }
}


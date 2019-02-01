import React from 'react'
import {
  Easing,
} from 'react-native'

import ItemsScreenContainer from '../containers/ItemsScreen.js'
import AccountScreen from './AccountScreen.js'
import FeedsScreenContainer from '../containers/FeedsScreen.js'
import { FluidNavigator } from 'react-navigation-fluid-transitions'

// temporary hacky approach


// class App extends React.Component {

//   constructor (props) {
//     super(props)
//     this.props = props
//   }

//   componentDidMount () {
//     SplashScreen.hide()
//   }

//   render () {
//     return (
//       <View style={styles.mainView}>
//         <AppStateListenerContainer />
//         <StatusBar barStyle='dark-content' />
//         <RizzleModalContainer />
//         <FeedView />
//       </View>
//     )
//   }
// }

const transitionConfig = {
  duration: 300,
  // timing: Animated.timing,
  easing: Easing.out(Easing.elastic(1)),
  // useNativeDriver: true
}

const navigationOptions = {
  gesturesEnabled: false
}

export default FluidNavigator(
  {
    Account: { screen: AccountScreen },
    Feeds: { screen: FeedsScreenContainer },
    Items: { screen: ItemsScreenContainer },
  },
  {
    initialRouteName: 'Feeds',
    transitionConfig,
    navigationOptions
  }
)

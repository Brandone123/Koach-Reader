import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Unsupported top level event type "topInsetsChange" dispatched']);

// Initialize screens after imports but before app components
import { enableScreens } from 'react-native-screens';
enableScreens();

// Register the app
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App); 
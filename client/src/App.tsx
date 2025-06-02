import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LogBox } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <AppNavigator />
      </I18nextProvider>
    </Provider>
  );
} 
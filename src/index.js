import './index.css'

import React from 'react'
import {render} from 'react-dom'
import { Provider } from 'react-redux';
import App from './App'
import store, {persistor} from './store';
import { PersistGate } from 'redux-persist/integration/react'
import Loading from './components/Loading';

render(
    (<Provider store={store}>
        <PersistGate loading={Loading()} persistor={persistor}>
            <App/>
        </PersistGate>
    </Provider>),
    document.querySelector('#app')
);
// https://wicg.github.io/ResizeObserver/
if (global.window) {
    window.ResizeObserver = window.ResizeObserver || require('resize-observer-polyfill');
}
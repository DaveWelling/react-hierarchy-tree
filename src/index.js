import './index.css'

import React from 'react'
import {render} from 'react-dom'
import { Provider } from 'react-redux';
import App from './App'
import getStore from './store';

render(
    (<Provider store={getStore()}>
        <App/>
    </Provider>),
    document.querySelector('#app')
);

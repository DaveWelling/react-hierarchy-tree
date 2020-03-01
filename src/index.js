import './index.css';

import React from 'react';
import {render} from 'react-dom';
import App from './App';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

render(<App/>,
    document.querySelector('#app')
);
// https://wicg.github.io/ResizeObserver/
if (global.window) {
    window.ResizeObserver = window.ResizeObserver || require('resize-observer-polyfill').default;
}
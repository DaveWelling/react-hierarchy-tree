import './index.css';

import React from 'react';
import {render} from 'react-dom';
import Main from './Main';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

render(<Main/>,
    document.querySelector('#app')
);
// https://wicg.github.io/ResizeObserver/
if (global.window) {
    window.ResizeObserver = window.ResizeObserver || require('resize-observer-polyfill').default;
}
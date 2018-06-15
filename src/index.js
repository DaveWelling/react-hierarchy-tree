import './index.css'

import React from 'react'
import {render} from 'react-dom'
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { createReducer } from 'redux-orm';
import { Provider } from 'react-redux';
import { createLogger} from 'redux-logger';
import eventSink from './eventSink';
import App from './App'
//import getStore from './store';
import bootstrap from './orm/bootstrap';
import orm from './orm';

// add other reducers as properties beside 'orm'
const rootReducer = combineReducers({
    orm: createReducer(orm)
});

// We're using `redux-logger`. Open up the console in the demo and you can inspect
// the internal state maintained by Redux-ORM.
const createStoreWithMiddleware = applyMiddleware(createLogger(), eventSink.eventSink)(createStore);
const store = createStoreWithMiddleware(rootReducer, bootstrap(orm));

render(
    (<Provider store={store}>
        <App/>
    </Provider>),
    document.querySelector('#app')
);

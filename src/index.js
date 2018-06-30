import './index.css'

import React from 'react'
import {render} from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { createReducer } from 'redux-orm';
import { Provider } from 'react-redux';
import { createLogger} from 'redux-logger';
import eventSink from './eventSink';
import App from './App'
import bootstrap from './orm/bootstrap';
import orm from './orm';
import NOVEL_MODEL from './reducers/modelReducer';
import thunk from 'redux-thunk';
import config from './config';

// add other reducers as properties beside 'orm'
const appReducer = combineReducers({
    orm: createReducer(orm),
    NOVEL_MODEL
});

const rootReducer = (state, action)=>{
    if (action.type === 'IMPORT_NOVEL') {
        config.rootModelId = action.import.data.rootModelId;
        state = {orm: action.import.data.orm, NOVEL_MODEL: {}};
    }
    return appReducer(state,action);
}

// We're using `redux-logger`. Open up the console in the demo and you can inspect
// the internal state maintained by Redux-ORM.
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    rootReducer,
    bootstrap(orm),
    composeEnhancers(
        applyMiddleware(createLogger(), thunk, eventSink.eventSink)
    )
);

render(
    (<Provider store={store}>
        <App/>
    </Provider>),
    document.querySelector('#app')
);

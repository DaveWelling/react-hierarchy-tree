import bootstrap from './orm/bootstrap';
import orm from './orm';
import NOVEL_MODEL from './reducers/modelReducer';
import thunk from 'redux-thunk';
import config from './config';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web and AsyncStorage for react-native
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { createReducer } from 'redux-orm';
import eventSink from './eventSink';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import {get} from 'lodash';

// add other reducers as properties beside 'orm'
const appReducer = combineReducers({
    orm: createReducer(orm),
    NOVEL_MODEL
});

const rootReducer = (state, action) => {
    if (action.type === 'IMPORT_NOVEL') {
        state = getImportedState(action);
    }
    return appReducer(state, action);
};

const persistConfig = {
    key: 'root',
    storage,
    stateReconciler: autoMergeLevel2
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

// We're using `redux-logger`. Open up the console in the demo and you can inspect
// the internal state maintained by Redux-ORM.
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    persistedReducer,
    bootstrap(orm),
    composeEnhancers(applyMiddleware(thunk, eventSink.eventSink))
);

export default store;
export const persistor = persistStore(store, null, function(){
    // let state = store.getState();
    // debugger;
    // let rootModelId = get(state, 'NOVEL_MODEL.rootModelId');
    // if (rootModelId !== undefined){
    //     config.rootModelId = rootModelId;
    // }
});

function getImportedState(action) {
    const rootModelId = action.import.data.rootModelId;
    persistor.purge();
    return {
        orm: action.import.data.orm,
        NOVEL_MODEL: {
            rootModelId
        }
    };
}

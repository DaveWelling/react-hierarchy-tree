import bootstrap from '../orm/bootstrap';
import orm from '../orm';
import getModelReducer from '../reducers/modelReducer';
import thunk from 'redux-thunk';
import config from '../config';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web and AsyncStorage for react-native
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { createReducer } from 'redux-orm';
import eventSink from './eventSink';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import cuid from 'cuid';


const rootModelId = config.rootModelId || cuid();
const initialOrmState = bootstrap(orm, rootModelId);

const initialProjectModelState = getInitialAppModelState(rootModelId, initialOrmState);

// add other reducers as properties beside 'orm'
const appReducer = combineReducers({
    orm: createReducer(orm),
    project_model: getModelReducer(initialProjectModelState)
});

const rootReducer = (state, action) => {
    if (action.type === 'import_app') {
        state = getImportedState(action);
    }
    if (action.type === 'clear_app') {
        state = getEmptyState();
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
    initialOrmState,
    composeEnhancers(applyMiddleware(thunk, eventSink.eventSink))
);

export default store;

export const persistor = persistStore(store, null, function(){
    //optional callback for when rehydration of local data for the store is finished.
});

function getEmptyState(){
    const rootModelId = cuid();
    const ormState = bootstrap(orm, rootModelId);

    return {
        ...ormState,
        project_model: getInitialAppModelState(rootModelId, ormState)
    };
}

function getImportedState(action) {
    const rootModelId = action.import.data.rootModelId;
    return {
        orm: action.import.data.orm,
        project_model: {
            rootModelId
        }
    };
}

function getInitialAppModelState(rootModelId, initialOrmState) {
    const defaultFocusModel = Object.values(initialOrmState.orm.Model.itemsById).find(m=>m.parent===rootModelId && m.title==='');
    return {
        rootModelId,
        selectedId: defaultFocusModel ? defaultFocusModel._id: undefined,
        model: defaultFocusModel,
        selectionStart: 0,
        selectionEnd: 0
    }
}
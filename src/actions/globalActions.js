import {persistor} from '../store';
export function clearState(){
    persistor.purge();
    return {
        type: 'CLEAR_NOVEL',
        clear: {}
    }
}
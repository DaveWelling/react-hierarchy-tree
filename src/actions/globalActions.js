import {persistor} from '../store';
export function clearState(){
    persistor.purge();
    return {
        type: 'clear_app',
        clear: {}
    }
}
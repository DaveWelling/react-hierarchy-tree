import config from '../config';

export default function MODELReducer(state={selectedId:undefined, rootModelId: config.rootModelId}, action){
    switch (action.type) {
        case 'FOCUS_NOVEL_MODEL':
            return {
                ...state,
                selectedId: action.focus._id,
                model: action.focus.model,
                selectionStart: action.focus.selectionStart,
                selectionEnd: action.focus.selectionEnd
            }
            break;
        case 'DRAG_NOVEL_MODEL_START':
            return {...state, dragging: action.drag.model};
        case 'DRAG_NOVEL_MODEL_END':
            return {...state, dragging: undefined};
    }
    return state;
}
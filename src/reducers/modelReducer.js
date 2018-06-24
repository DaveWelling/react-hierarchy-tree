export default function MODELReducer(state={selectedId:undefined}, action){
    switch (action.type) {
        case 'FOCUS_NOVEL_MODEL':
            return {
                selectedId: action.focus._id,
                model: action.focus.model
            }
            break;
        case 'DRAG_NOVEL_MODEL_START':
            return {...state, dragging: action.drag.model};
        case 'DRAG_NOVEL_MODEL_END':
            return {...state, dragging: undefined};
    }
    return state;
}
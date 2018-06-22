export default function eventReducer(state={selectedId:undefined}, action){
    switch (action.type) {
        case 'FOCUS_NOVEL_EVENT':
            return {
                selectedId: action.focus._id
            }
            break;
        case 'DRAG_NOVEL_EVENT_START':
            return {...state, dragging: action.drag.event};
        case 'DRAG_NOVEL_EVENT_END':
            return {...state, dragging: undefined};
    }
    return state;
}
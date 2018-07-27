
export default function getModelReducer(initialNovelModelState) {
    return function ModelReducer(state=initialNovelModelState, action){
        switch (action.type) {
            case 'focus_app_model':
                return {
                    ...state,
                    selectedId: action.focus._id,
                    model: action.focus.model,
                    selectionStart: action.focus.selectionStart,
                    selectionEnd: action.focus.selectionEnd
                }
                break;
            case 'drag_app_model_start':
                return {...state, dragging: action.drag.model};
            case 'drag_app_model_end':
                return {...state, dragging: undefined};
        }
        return state;
    }
}
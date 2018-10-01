
export default function getModelReducer(initialProjectModelState) {
    return function ModelReducer(state=initialProjectModelState, action){
        switch (action.type) {
            case 'update_current': {
                return {
                    ...state,
                    model: action.update.model
                }
            }
            case 'change_project_name': {
                return {
                    ...state,
                    name: action.change.name
                };
            }
            case 'focus_project_model':
                return {
                    ...state,
                    model: {
                        ...action.focus.model
                    }
                }
            case 'drag_project_model_start':
                return {...state, dragging: action.drag.model};
            case 'drag_project_model_end':
                return {...state, dragging: undefined};
        }
        return state;
    }
}
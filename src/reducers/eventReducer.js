export default function eventReducer(state={selectedId:undefined}, action){
    switch (action.type) {
        case 'FOCUS_NOVEL_EVENT':
            return {
                selectedId: action.focus._id
            }
    }
    return state;
}
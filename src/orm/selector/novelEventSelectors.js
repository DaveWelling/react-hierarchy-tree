export const getNovelEvent = (state, _id) =>{
    return state.Event? state.Event.itemsById[_id] : state.orm.Event.itemsById[_id];
}
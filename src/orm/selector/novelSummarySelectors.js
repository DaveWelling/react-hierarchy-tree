export const getNovelSummary = (state, _id) =>{
    return state.Summary? state.Summary.itemsById[_id] : state.orm.Summary.itemsById[_id];
}
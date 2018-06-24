export const getNovelChapter = (state, _id) =>{
    return state.Chapter? state.Chapter.itemsById[_id] : state.orm.Chapter.itemsById[_id];
}
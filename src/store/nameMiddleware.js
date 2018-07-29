import { childrenForParentId, parentIdSelector } from '../orm/selector/modelSelectors';
/**
 * If this is the first child of the rootModelId, then the title is also the name of the entire project.
 */
const nameMiddleware = store => next => action => {
    if (action.type === 'update_project_model') {
        let state = store.getState();
        const parentId = parentIdSelector(state.orm, action.update._id);
        if (parentId === state.project_model.rootModelId) {
            if (action.update.changes.title) {
                const children = childrenForParentId(state, parentId);
                if (children[0]._id === action.update._id) {
                    store.dispatch({
                        type: 'change_project_name',
                        change: {
                            name: action.update.changes.title
                        }
                    });
                }
            }
        }
    }
    return next(action);
};

export default nameMiddleware;

import { childrenForParentId, parentIdSelector } from '../orm/selector/modelSelectors';
import config from '../config';
/**
 * If this is the first child of the rootModelId, then the title is also the name of the entire project.
 */
export default (nameMiddleware = store => next => action => {
    if (action.type === 'update_project_model') {
        let state = store.getState();
        const parentId = parentIdSelector(action.update._id);
        if (parentId === config.rootModelId) {
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
});

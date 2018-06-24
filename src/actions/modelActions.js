
import cuid from 'cuid';
import { getPreviousSibling, getModelRef, childrenForParentId, getNextSibling } from '../orm/selector/modelSelectors';

//************* MOVE ACTIONS OUT OF TREENODE INTO HERE USING GETSTATE FROM THUNK *************************
export function makeChildOfPreviousSibling(_id, selectionStart, selectionEnd) {
    return function(dispatch, getState) {
        const state = getState();
        const model = getModelRef(state, _id);
        const previousSiblingData = getPreviousSibling(state, _id);
        if (!previousSiblingData) return; // first sibling cannot be indented further
        dispatch({
            type: 'UPDATE_NOVEL_MODEL',
            update: {
                _id,
                changes: {
                    parent: previousSiblingData._id
                }
            }
        });
        dispatch({
            type: 'RESEQUENCE_NOVEL_MODEL',
            resequence: {
                _id,
                parentId: previousSiblingData._id,
                position: 'end'
            }
        });
        dispatch({
            type: 'EnsureExpanded_novel_model',
            ensureExpanded: {
                _id
            }
        });
        dispatch({
            type: 'FOCUS_NOVEL_MODEL',
            focus: {
                _id,
                model,
                selectionStart,
                selectionEnd
            }
        });
    }
}

export function makeSiblingOfParent(model, selectionStart, selectionEnd) {
    return function(dispatch, getState) {
        const state = getState();
        const _id = model._id;
        // Get new parent
        const previousParentId = model.parent;
        const previousParent = getModelRef(state, previousParentId)
        const newParent = getModelRef(state, previousParent.parent);
        // Get new sequence
        const nextSibling = getNextSibling(state, previousParentId)
        const sequenceAfterPreviousParent = nextSibling? nextSibling.sequence : undefined;
        const newSequence = sequenceAfterPreviousParent
            ? previousParent.sequence + (sequenceAfterPreviousParent - previousParent.sequence) / 2
            : previousParent.sequence + 1;
        dispatch({
            type: 'UPDATE_NOVEL_MODEL',
            update: {
                _id,
                changes: {
                    parent: newParent ? newParent._id : undefined,
                    sequence: newSequence
                }
            }
        });
        dispatch({
            type: 'FOCUS_NOVEL_MODEL',
            focus: {
                _id,
                model,
                selectionStart,
                selectionEnd
            }
        });
    }
}

export function makeNextSiblingOfModel(targetId, siblingModel) {
    return function(dispatch, getState) {
        const state = getState();
        // Get new sequence
        const model = getModelRef(state, targetId);
        const nextSibling = getNextSibling(state, siblingModel._id);
        const sequenceAfterSiblingModel = nextSibling? nextSibling.sequence : undefined;
        const newSequence = sequenceAfterSiblingModel
            ? siblingModel.sequence + (sequenceAfterSiblingModel - siblingModel.sequence) / 2
            : siblingModel.sequence + 1;
        dispatch({
            type: 'UPDATE_NOVEL_MODEL',
            update: {
                _id: targetId,
                changes: {
                    parent: siblingModel.parent,
                    sequence: newSequence
                }
            }
        });
        dispatch({
            type: 'FOCUS_NOVEL_MODEL',
            focus: {
                _id: targetId,
                model,
                selectionStart: 0,
                selectionEnd: 0
            }
        });
    }
}

export function addChild(previousChild, newChildValue, sequenceAfterPreviousChild) {
    return function(dispatch) {
        // increment sequence by half of the last digit of the previous child's sequence
        const newSequence = sequenceAfterPreviousChild
            ? previousChild.sequence + (sequenceAfterPreviousChild - previousChild.sequence) / 2
            : previousChild.sequence + 1;
        const newId = cuid();
        const newModel = {
            _id: newId,
            title: newChildValue,
            value: newChildValue,
            parent: previousChild.parent,
            sequence: newSequence,
            type: defaultModelType
        }
        dispatch({
            type: 'CREATE_NOVEL_MODEL',
            create: {
                newModel
            }
        });
        dispatch({
            type: 'TRANSFER_NOVEL_MODEL',
            transfer: {
                currentParentId: previousChild._id,
                newParentId: newId
            }
        });
        dispatch({
            type: 'FOCUS_NOVEL_MODEL',
            focus: {_id: newId, model: newModel}
        });
    }
}

export function mergeWithPreviousSibling(model) {
    return function(dispatch, getState) {
        let state = getState();
        let previousSibling = getPreviousSibling(state, model._id);
        let modelChildren = childrenForParentId(state, model._id)
        if (modelChildren && modelChildren.length > 0 && !previousSibling) {
            return // do nothing because there is no place to transfer the children.
        }
        if (previousSibling) {
            if (model.title !== '') {
                dispatch({
                    type: 'UPDATE_NOVEL_MODEL',
                    update: {
                        _id: previousSibling._id,
                        changes: {
                            title: previousSibling.title + model.title
                        }
                    }
                });
                // Place cursor at start of merged value
                dispatch({
                    type: 'FOCUS_NOVEL_MODEL',
                    focus: {
                        _id: previousSibling._id,
                        model: previousSibling,
                        selectionStart: previousSibling.title.length,
                        selectionEnd: previousSibling.title.length
                    }
                });
            }
            if (modelChildren && modelChildren.length > 0) {
                dispatch({
                    type: 'TRANSFER_NOVEL_MODEL',
                    transfer: {
                        currentParentId: model._id,
                        newParentId: previousSibling._id
                    }
                });
            }
        }

        dispatch({
            type: 'REMOVE_NOVEL_MODEL',
            remove: {
                _id: model._id
            }
        });
    }
}

export function moveToPrevious(model) {
    return function(dispatch, getState) {
        let focusModel;
        const state = getState();
        const previousSibling = getPreviousSibling(state, model._id)
        if (previousSibling && previousSibling.ui.collapsed === false) { // use ref equality to ensure collapsed property actually exists.
            const children = childrenForParentId(state, previousSibling._id);
             if (children && children.length) {
                 focusModel = children[children.length-1];
             }
        }
        focusModel = focusModel || (previousSibling ? previousSibling : getModelRef(state, model.parent));
        if (!focusModel) return;  // No where else to go.

        dispatch({
            type: 'FOCUS_NOVEL_MODEL',
            focus: {
                _id: focusModel._id,
                model: focusModel,
                selectionStart: 0,
                selectionEnd: 0
            }
        });
    }
}

export function moveToNext(model) {
    return function(dispatch, getState) {
        let focusId, focusModel;
        const state = getState();
        if (model.ui.collapsed === false) { // use ref equality to ensure collapsed property actually exists.
             const children = childrenForParentId(state, model._id);
             if (children && children[0]) {
                 focusId = children[0]._id;
                 focusModel = children[0];
             }
        }
        if (focusId === undefined) {
            let nextSibling = getNextSibling(state, model._id)
            if (nextSibling) focusId = nextSibling._id;
            else if (!model.parent) return; //No where else to go;
            else {
                nextSibling = getNextSibling(state, model.parent)
                if (!nextSibling) return; //No where else to go;
                focusId = nextSibling._id;
                focusModel = nextSibling;
            }
        }
        dispatch({
            type: 'FOCUS_NOVEL_MODEL',
            focus: {
                _id: focusId,
                model: focusModel,
                selectionStart: 0,
                selectionEnd: 0
            }
        });
    }
}

export function focus(model){
    return function(dispatch, getState) {
        dispatch({
            type: 'FOCUS_NOVEL_MODEL',
            focus: {
                _id: model._id,
                model,
                selectionStart: 0,
                selectionEnd: 0
            }
        });
    }
}
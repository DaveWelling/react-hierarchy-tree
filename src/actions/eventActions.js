
import cuid from 'cuid';
import { getPreviousSibling, getEventRef, childrenForParentId, getNextSibling } from '../orm/selector/eventSelectors';

//************* MOVE ACTIONS OUT OF TREENODE INTO HERE USING GETSTATE FROM THUNK *************************
export function makeChildOfPreviousSibling(_id, selectionStart, selectionEnd) {
    return function(dispatch, getState) {
        const state = getState();
        const previousSiblingData = getPreviousSibling(state, _id);
        if (!previousSiblingData) return; // first sibling cannot be indented further
        dispatch({
            type: 'UPDATE_NOVEL_EVENT',
            update: {
                _id,
                changes: {
                    parent: previousSiblingData._id
                }
            }
        });
        dispatch({
            type: 'RESEQUENCE_NOVEL_EVENT',
            resequence: {
                _id,
                parentId: previousSiblingData._id,
                position: 'end'
            }
        });
        dispatch({
            type: 'EnsureExpanded_novel_event',
            ensureExpanded: {
                _id
            }
        });
        dispatch({
            type: 'FOCUS_NOVEL_EVENT',
            focus: {
                _id,
                selectionStart,
                selectionEnd
            }
        });
    }
}

export function makeSiblingOfParent(event, selectionStart, selectionEnd) {
    return function(dispatch, getState) {
        const state = getState();
        const _id = event._id;
        // Get new parent
        const previousParentId = event.parent;
        const previousParent = getEventRef(state, previousParentId)
        const newParent = getEventRef(state, previousParent.parent);
        // Get new sequence
        const nextSibling = getNextSibling(state, previousParentId)
        const sequenceAfterPreviousParent = nextSibling? nextSibling.sequence : undefined;
        const newSequence = sequenceAfterPreviousParent
            ? previousParent.sequence + (sequenceAfterPreviousParent - previousParent.sequence) / 2
            : previousParent.sequence + 1;
        dispatch({
            type: 'UPDATE_NOVEL_EVENT',
            update: {
                _id,
                changes: {
                    parent: newParent ? newParent._id : undefined,
                    sequence: newSequence
                }
            }
        });
        dispatch({
            type: 'FOCUS_NOVEL_EVENT',
            focus: {
                _id,
                selectionStart,
                selectionEnd
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
        dispatch({
            type: 'CREATE_NOVEL_EVENT',
            create: {
                newEvent: {
                    _id: newId,
                    title: newChildValue,
                    value: newChildValue,
                    parent: previousChild.parent,
                    sequence: newSequence
                }
            }
        });
        dispatch({
            type: 'TRANSFER_NOVEL_EVENT',
            transfer: {
                currentParentId: previousChild._id,
                newParentId: newId
            }
        });
        dispatch({
            type: 'FOCUS_NOVEL_EVENT',
            focus: {_id: newId}
        });
    }
}

export function mergeWithPreviousSibling(event) {
    return function(dispatch, getState) {
        let state = getState();
        let previousSibling = getPreviousSibling(state, event._id);
        let eventChildren = childrenForParentId(state, event._id)
        if (eventChildren && eventChildren.length > 0 && !previousSibling) {
            return // do nothing because there is no place to transfer the children.
        }
        if (previousSibling) {
            if (event.title !== '') {
                dispatch({
                    type: 'UPDATE_NOVEL_EVENT',
                    update: {
                        _id: previousSibling._id,
                        changes: {
                            title: previousSibling.title + event.title
                        }
                    }
                });
                // Place cursor at start of merged value
                dispatch({
                    type: 'FOCUS_NOVEL_EVENT',
                    focus: {
                        _id: previousSibling._id,
                        selectionStart: previousSibling.title.length,
                        selectionEnd: previousSibling.title.length
                    }
                });
            }
            if (eventChildren && eventChildren.length > 0) {
                dispatch({
                    type: 'TRANSFER_NOVEL_EVENT',
                    transfer: {
                        currentParentId: event._id,
                        newParentId: previousSibling._id
                    }
                });
            }
        }

        dispatch({
            type: 'REMOVE_NOVEL_EVENT',
            remove: {
                _id: event._id
            }
        });
    }
}
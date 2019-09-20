const config = require('../config');
const database = require('../database');
const eventSink = require('../store/eventSink');
const {defaultCollectionName} = config;
const {getRepository}= database;

module.exports = {
    valueChange,
    getChildren,
    getPreviousSibling,
    resequenceProjectModel,
    ensureExpandedProjectModel,
    makeChildOfPreviousSibling,
    getNextSibling,
    makeSiblingOfParent,
    makeNextSiblingOfModel
};
async function valueChange(_id, propertyName, value, collectionName=defaultCollectionName) {
    return getRepository(collectionName).then(repo=>repo.update(_id, propertyName, value));
}

function getChildren(parentId, collectionName=defaultCollectionName) {
    return getRepository(collectionName).then(repo=>{
        return repo.find(collection=>collection.where('parentId').eq(parentId));
    });
}

async function getPreviousSibling(_id, collectionName=defaultCollectionName) {
    let repo = await getRepository(collectionName);
    let record = await repo.get(_id);
    let allSiblings = await getChildren(record.parentId, collectionName);
    allSiblings = allSiblings.sort((a,b)=>a.seq-b.seq);
    let recordIndex = allSiblings.findIndex(sib=>sib._id === _id);
    if (recordIndex > 0) return allSiblings[recordIndex-1];
}


async function getNextSibling(_id, collectionName=defaultCollectionName) {
    let repo = await getRepository(collectionName);
    let record = await repo.get(_id);
    let allSiblings = await getChildren(record.parentId, collectionName);
    allSiblings = allSiblings.sort((a,b)=>a.seq-b.seq);
    let recordIndex = allSiblings.findIndex(sib=>sib._id === _id);
    if (recordIndex < allSiblings.length) return allSiblings[recordIndex+1];
}

async function resequenceProjectModel(_id, parentId, position, collectionName=defaultCollectionName) {
    const children = await getChildren(parentId, collectionName);
    let newSequence;
    if (children) {
        if (position === 'end') {
            const max = children.reduce((max, child)=>{
                if (child._id === _id) return max;
                return Math.max(max, child.sequence);
            }, -1);
            newSequence = max + 1;
            await valueChange(_id, 'sequence', newSequence, collectionName);
        }
    }
}

function getModel(_id, collectionName=defaultCollectionName){
    return getRepository(collectionName).then(repo=>repo.get(_id));
}

async function ensureExpandedProjectModel(_id, collectionName=defaultCollectionName) {
    const model = await getModel(_id, collectionName);
    async function expandToRoot(parentModel){
        const parentId = parentModel.parentId;
        if (parentId === parentModel._id) {
            throw new Error(`The record with _id ${parentModel._id} has a parentId with the same value.  This is not allowed because it creates infinite loops.`);
        }
        const expandingModel = await getRepository(collectionName).then(repo=>repo.get(parentId));
        if (!expandingModel.ui || expandingModel.ui.collapsed) {
            await expandingModel.update({
                $set: {
                    ui: {collapsed: false}
                }
            });
        }
        if (expandingModel.parentId === 'root') return;
        await expandToRoot(expandingModel);
    }
    await expandToRoot(model);
}

async function makeChildOfPreviousSibling(_id, selectionStart, selectionEnd, collectionName=defaultCollectionName) {
    const model = getModel(_id);
    const previousSiblingData = await getPreviousSibling(_id, collectionName);
    if (!previousSiblingData) return; // first sibling cannot be indented further
    await valueChange(_id, 'parentId', previousSiblingData._id, collectionName);
    await resequenceProjectModel(_id, previousSiblingData._id, 'end', collectionName);
    await ensureExpandedProjectModel(_id, collectionName);
    eventSink.publish({
        type: 'focus_project_model',
        focus: {
            _id,
            model,
            selectionStart,
            selectionEnd
        }
    });
}

async function makeSiblingOfParent(model, selectionStart, selectionEnd, collectionName) {
        const _id = model._id;
        // Get new parent
        const previousParentId = model.parentId;
        const previousParent = await getModel(previousParentId, collectionName);
        const newParent = await getModel(previousParent.parentId, collectionName);
        // Get new sequence
        const nextSibling = await getNextSibling(previousParentId, collectionName);
        const sequenceAfterPreviousParent = nextSibling? nextSibling.sequence : undefined;
        const newSequence = sequenceAfterPreviousParent
            ? previousParent.sequence + (sequenceAfterPreviousParent - previousParent.sequence) / 2
            : previousParent.sequence + 1;
        await model.update({
            $set: {
                parentId: newParent._id ,
                sequence: newSequence
            }
        });
        eventSink.publish({
            type: 'focus_project_model',
            focus: {
                _id,
                model, selectionStart, selectionEnd
            }
        });
}

async function makeNextSiblingOfModel(targetId, siblingModel, collectionName=defaultCollectionName) {
    // Get new sequence
    const model = await getModel(targetId, collectionName);
    const nextSibling = await getNextSibling(siblingModel._id, collectionName);
    const sequenceAfterSiblingModel = nextSibling? nextSibling.sequence : undefined;
    const newSequence = sequenceAfterSiblingModel
        ? siblingModel.sequence + (sequenceAfterSiblingModel - siblingModel.sequence) / 2
        : siblingModel.sequence + 1;
    await model.update({
        $set: {
            parentId: siblingModel.parentId ,
            sequence: newSequence
        }
    });
    eventSink.publish({
        type: 'focus_project_model',
        focus: {
            _id: targetId,
            model
        }
    });
}

// export function addChild(previousChild, newChildValue, sequenceAfterPreviousChild, type=config.defaultModelType) {
//     return function(dispatch) {
//         // increment sequence by half of the last digit of the previous child's sequence
//         const newSequence = sequenceAfterPreviousChild
//             ? previousChild.sequence + (sequenceAfterPreviousChild - previousChild.sequence) / 2
//             : previousChild.sequence + 1;
//         const newId = cuid();
//         const newModel = {
//             _id: newId,
//             title: newChildValue,
//             value: newChildValue,
//             parent: previousChild.parent,
//             sequence: newSequence,
//             type
//         }
//         dispatch({
//             type: 'create_project_model',
//             create: {
//                 newModel
//             }
//         });
//         dispatch({
//             type: 'transfer_project_model',
//             transfer: {
//                 currentParentId: previousChild._id,
//                 newParentId: newId
//             }
//         });
//         dispatch({
//             type: 'focus_project_model',
//             focus: {
//                 _id: newId,
//                 model: newModel
//             }
//         });
//     }
// }

// export function mergeWithPreviousSibling(model) {
//     return function(dispatch, getState) {
//         let state = getState();
//         let previousSibling = getPreviousSibling(state, model._id);
//         let modelChildren = childrenForParentId(state, model._id)
//         if (modelChildren && modelChildren.length > 0 && !previousSibling) {
//             return // do nothing because there is no place to transfer the children.
//         }
//         if (previousSibling) {
//             if (model.title !== '') {
//                 dispatch({
//                     type: 'update_project_model',
//                     update: {
//                         _id: previousSibling._id,
//                         changes: {
//                             title: previousSibling.title + model.title
//                         }
//                     }
//                 });
//                 // Place cursor at start of merged value
//                 dispatch({
//                     type: 'focus_project_model',
//                     focus: {
//                         _id: previousSibling._id,
//                         model: previousSibling,
//                         selectionStart: previousSibling.title.length,
//                         selectionEnd: previousSibling.title.length
//                     }
//                 });
//             }
//             if (modelChildren && modelChildren.length > 0) {
//                 dispatch({
//                     type: 'transfer_project_model',
//                     transfer: {
//                         currentParentId: model._id,
//                         newParentId: previousSibling._id
//                     }
//                 });
//             }
//         }

//         dispatch({
//             type: 'remove_project_model',
//             remove: {
//                 _id: model._id
//             }
//         });
//     }
// }

// export function moveToPrevious(model) {
//     return function(dispatch, getState) {
//         let focusModel;
//         const state = getState();
//         const previousSibling = getPreviousSibling(state, model._id)
//         if (previousSibling && previousSibling.ui.collapsed === false) { // use ref equality to ensure collapsed property actually exists.
//             const children = childrenForParentId(state, previousSibling._id);
//              if (children && children.length) {
//                  focusModel = children[children.length-1];
//              }
//         }
//         focusModel = focusModel || (previousSibling ? previousSibling : getModelRef(state, model.parent));
//         if (!focusModel) return;  // No where else to go.

//         dispatch({
//             type: 'focus_project_model',
//             focus: {
//                 _id: focusModel._id,
//                 model: focusModel
//             }
//         });
//     }
// }

// export function moveToNext(model) {
//     return function(dispatch, getState) {
//         let focusId, focusModel;
//         const state = getState();
//         if (model.ui.collapsed === false) { // use ref equality to ensure collapsed property actually exists.
//              const children = childrenForParentId(state, model._id);
//              if (children && children[0]) {
//                  focusId = children[0]._id;
//                  focusModel = children[0];
//              }
//         }
//         if (focusId === undefined) {
//             let nextSibling = getNextSibling(state, model._id)
//             if (nextSibling) focusId = nextSibling._id;
//             else if (!model.parent) return; //No where else to go;
//             else {
//                 nextSibling = getNextSibling(state, model.parent)
//                 if (!nextSibling) return; //No where else to go;
//                 focusId = nextSibling._id;
//                 focusModel = nextSibling;
//             }
//         }
//         dispatch({
//             type: 'focus_project_model',
//             focus: {
//                 _id: focusId,
//                 model: focusModel
//             }
//         });
//     }
// }

// export function focus(model){
//     return function(dispatch, getState) {
//         dispatch({
//             type: 'focus_project_model',
//             focus: {
//                 _id: model._id,
//                 model
//             }
//         });
//     }
// }
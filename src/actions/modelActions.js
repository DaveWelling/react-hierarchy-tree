const config = require('../config');
const database = require('../database');
const eventSink = require('../eventSink');
const { defaultCollectionName } = config;
const { getRepository } = database;
const cuid = require('cuid');
const {get, set} = require('lodash');

module.exports = {
    addChild,
    ensureExpandedProjectModel,
    findBottomVisibleChild,
    focus,
    getChildren,
    getNextSibling,
    getPreviousSibling,
    makeChildOfPreviousSibling,
    makeNextSiblingOfModel,
    makeSiblingOfParent,
    mergeWithPreviousSibling,
    moveChildrenToDifferentParent,
    moveToNext,
    moveFocusToPrevious,
    moveValuePropertiesToNewParent,
    removeModel,
    resequenceProjectModel,
    toggleCollapse,
    updateModel,
    valueChange
};

async function updateModel(model, collectionName=defaultCollectionName) {
    return getRepository(collectionName).then(repo => {
        return repo.update(model);
    });

}

async function removeModel(_id, collectionName = defaultCollectionName) {
    return getRepository(collectionName).then(repo => {
        return repo.remove(_id);
    });
}

async function valueChange(_id, propertyName, value, collectionName = defaultCollectionName) {
    return getRepository(collectionName).then(repo => repo.update(_id, propertyName, value));
}

function getChildren(parentId, collectionName = defaultCollectionName) {
    return getRepository(collectionName).then(repo => {
        return repo.find({parentId});
    });
}

async function getPreviousSibling(_id, collectionName = defaultCollectionName) {
    let repo = await getRepository(collectionName);
    let record = await repo.get(_id);
    let allSiblings = await getChildren(record.parentId, collectionName);
    allSiblings = allSiblings.sort((a, b) => a.seq - b.seq);
    let recordIndex = allSiblings.findIndex(sib => sib._id === _id);
    if (recordIndex > 0) return allSiblings[recordIndex - 1];
}

async function getNextSibling(_id, collectionName = defaultCollectionName) {
    let repo = await getRepository(collectionName);
    let record = await repo.get(_id);
    let allSiblings = await getChildren(record.parentId, collectionName);
    allSiblings = allSiblings.sort((a, b) => a.seq - b.seq);
    let recordIndex = allSiblings.findIndex(sib => sib._id === _id);
    if (recordIndex < allSiblings.length) return allSiblings[recordIndex + 1];
}

async function resequenceProjectModel(_id, parentId, position, collectionName = defaultCollectionName) {
    const children = await getChildren(parentId, collectionName);
    let newSequence;
    if (children) {
        if (position === 'end') {
            const max = children.reduce((max, child) => {
                if (child._id === _id) return max;
                return Math.max(max, child.sequence);
            }, -1);
            newSequence = max + 1;
            await valueChange(_id, 'sequence', newSequence, collectionName);
        }
    }
}

function getModel(_id, collectionName = defaultCollectionName) {
    return getRepository(collectionName).then(repo => repo.get(_id));
}

async function toggleCollapse(_id, collectionName = defaultCollectionName) {
    const model = await getModel(_id, collectionName);
    const isCollapsed = get(model, 'ui.collapsed', false);
    set(model, 'ui.collapsed', !isCollapsed);
    await updateModel(model, collectionName);
}

async function ensureExpandedProjectModel(_id, collectionName = defaultCollectionName) {
    const model = await getModel(_id, collectionName);
    async function expandToRoot(parentModel) {
        const parentId = parentModel.parentId;
        if (parentId === parentModel._id) {
            throw new Error(
                `The record with _id ${parentModel._id} has a parentId with the same value.  This is not allowed because it creates infinite loops.`
            );
        }
        const repo = await getRepository(collectionName);
        const expandingModel = await repo.get(parentId);
        if (!expandingModel.ui || expandingModel.ui.collapsed) {
            set(expandingModel, 'ui.collapsed', false);
            await repo.update(expandingModel);
        }
        if (expandingModel.parentId === 'root') return;
        await expandToRoot(expandingModel);
    }
    await expandToRoot(model);
}

async function makeChildOfPreviousSibling(_id, selectionStart, selectionEnd, collectionName = defaultCollectionName) {
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
    const sequenceAfterPreviousParent = nextSibling ? nextSibling.sequence : undefined;
    const newSequence = sequenceAfterPreviousParent
        ? previousParent.sequence + (sequenceAfterPreviousParent - previousParent.sequence) / 2
        : previousParent.sequence + 1;
    const repo = await getRepository(collectionName);
    await repo.update({
        _id,
        parentId: newParent._id,
        sequence: newSequence
    });
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

async function makeNextSiblingOfModel(targetId, siblingModel, collectionName = defaultCollectionName) {
    // Get new sequence
    const model = await getModel(targetId, collectionName);
    const nextSibling = await getNextSibling(siblingModel._id, collectionName);
    const sequenceAfterSiblingModel = nextSibling ? nextSibling.sequence : undefined;
    const newSequence = sequenceAfterSiblingModel
        ? siblingModel.sequence + (sequenceAfterSiblingModel - siblingModel.sequence) / 2
        : siblingModel.sequence + 1;
    const repo = await getRepository(collectionName);
    await repo.update({
        _id: model._id,
        parentId: siblingModel.parentId,
        sequence: newSequence
    });
    eventSink.publish({
        type: 'focus_project_model',
        focus: {
            _id: targetId,
            model
        }
    });
}

async function addChild(
    previousChild,
    newChildValues,
    sequenceAfterPreviousChild,
    type = config.defaultModelType,
    collectionName = defaultCollectionName
) {
    // increment sequence by half of the last digit of the previous child's sequence
    const newSequence = sequenceAfterPreviousChild
        ? previousChild.sequence + (sequenceAfterPreviousChild - previousChild.sequence) / 2
        : previousChild.sequence + 1;
    const newId = cuid();
    const newModel = {
        _id: newId,
        parentId: previousChild.parentId,
        sequence: newSequence,
        type,
        ...newChildValues
    };
    let repo = await getRepository(collectionName);
    await repo.create(newModel);
    eventSink.publish({
        type: 'focus_project_model',
        focus: {
            _id: newId,
            model: newModel
        }
    });
    return newModel;
}

async function mergeWithPreviousSibling(model, collectionName = defaultCollectionName) {
    let previousSibling = await getPreviousSibling(model._id, collectionName);
    let modelChildren = await getChildren(model._id, collectionName);
    if (modelChildren && modelChildren.length > 0 && !previousSibling) {
        return; // do nothing because there is no place to transfer the children.
    }
    if (previousSibling) {
        if (model.title !== '') {
            await valueChange(previousSibling._id, 'title', previousSibling.title + model.title, collectionName);
            // Place cursor at start of merged value
            eventSink.publish({
                type: 'focus_project_model',
                focus: {
                    _id: previousSibling._id,
                    model: previousSibling,
                    selectionStart: previousSibling.title.length,
                    selectionEnd: previousSibling.title.length
                }
            });
        }
        if (modelChildren && modelChildren.length > 0) {
            await moveChildrenToDifferentParent(modelChildren, previousSibling._id, collectionName);
        }
        // TODO: Implement this when I have a better idea what is involved
        // moveValuePropertiesToNewParent(model._id, previousSibling._id, collectionName);
    }
    await removeModel(model._id, collectionName);
}

async function moveChildrenToDifferentParent(children, newParentId, collectionName = defaultCollectionName) {
    return Promise.all(
        children.map(c => {
            return valueChange(c._id, 'parentId', newParentId, collectionName);
        })
    );
}

async function moveValuePropertiesToNewParent(currentParentId, newParentId, collectionName = defaultCollectionName) {
    // TODO: Implement this when I have a better idea what is involved
    throw new Error('not implemented');
}

/**
 * Try to get the focus on whatever tree node is immediately above the current one in the
 * (visible) tree.
 * @param {object} model the model which currently has the focus
 * @param {string} collectionName the database collection containing the models
 */
async function moveFocusToPrevious(model, collectionName) {
    const previousSibling = await getPreviousSibling(model._id, collectionName);
    let focusModel = await findBottomVisibleChild(previousSibling);
    // Prefer 1) bottom-most visible child of previous sibling, 2) previous sibling 3) then parent
    focusModel = focusModel || (previousSibling ? previousSibling : await getModel(model.parentId, collectionName));
    // If nothing is found, then must be at the root.
    if (!focusModel) return; // No where else to go.

    eventSink.publish({
        type: 'focus_project_model',
        focus: {
            _id: focusModel._id,
            model: focusModel
        }
    });
}

async function findBottomVisibleChild(parent, collectionName = defaultCollectionName) {
    if (parent && !get(parent, 'ui.collapsed', true)) {
        const children = await getChildren(parent._id, collectionName);
        if (children && children.length) {
            const bottom = children[children.length - 1];
            return await findBottomVisibleChild(bottom, collectionName);
        }
    }
    return parent; // no children or no visible children
}

async function moveToNext(model, collectionName = defaultCollectionName) {
    let focusId, focusModel;
    // Try to move to first child
    // compare using ref equality to ensure collapsed property actually exists.
    if (get(model, 'ui.collapsed') === false) {
        const children = await getChildren(model._id, collectionName);
        if (children && children[0]) {
            focusId = children[0]._id;
            focusModel = children[0];
        }
    }
    if (focusId === undefined) {
        // Try to move to next sibling
        let nextSibling = await getNextSibling(model._id, collectionName);
        if (nextSibling) focusId = nextSibling._id;

        // No parent - Nowhere else to go;
        else if (!model.parentId) return;
        else {
            // Try to move to parent's next sibling
            nextSibling = await getNextSibling(model.parentId, collectionName);
            if (!nextSibling) return; //Nowhere else to go;
            focusId = nextSibling._id;
            focusModel = nextSibling;
        }
    }

    eventSink.publish({
        type: 'focus_project_model',
        focus: {
            _id: focusId,
            model: focusModel
        }
    });
}

function focus(model){
    eventSink.publish({
        type: 'focus_project_model',
        focus: {
            _id: model._id,
            model
        }
    });
}

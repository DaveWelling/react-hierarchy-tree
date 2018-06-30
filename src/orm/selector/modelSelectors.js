import { orm } from '../index';
import { createSelector } from 'reselect';
import { createSelector as ormCreateSelector } from 'redux-orm';

// FOR INFO REGARDING REDUX RESELECT SELECTORS:
// SEE https://github.com/reduxjs/reselect

// FOR INFO REGARDING SELECTORS FOR REDUX-ORM:
// SEE https://github.com/tommikaikkonen/redux-orm#redux-integration-1
// OR https://github.com/tommikaikkonen/redux-orm-primer/blob/migrate_to_0_9/app/selectors.js

// Selects the state managed by Redux-ORM.
export const ormSelector = state => state.orm;
const addIdAsInput = (state, _id) => _id

// Redux-ORM selectors work with redux reselect selectors. To feed input
// selectors to a Redux-ORM selector, we use the reselect `createSelector`.
export const childrenForParentId = createSelector(
    // The first input selector should always be the orm selector.
    // Behind the scenes, `schema.createSelector` begins a Redux-ORM
    // session with the state selected by `ormSelector` and passes
    // that Session instance as an argument instead.
    // So, `orm` is a Session instance.
    ormSelector,
    addIdAsInput,
    ormCreateSelector(orm, (session, parentId) => {
        let parent = session.Model.withId(parentId);
        let children = parent.children;
        children = children.orderBy(['sequence'])
        return children.toRefArray();
    })
);

export const getModelRef = (state, _id)=> state.Model ? state.Model.itemsById[_id] : state.orm.Model.itemsById[_id];

const parentIdSelector = (state, _id) => getModelRef(state, _id).parent;

export const isCollapsed = createSelector(
    getModelRef,
    (model)=> model.ui.collapsed
);

/**
 * This is horrible, but I'm leaving it here so I (and other maintainers)
 * can understand how the ormCreateSelector works (as of redux-orm 0.10.0)
 *
 * This code expects getPreviousSibling to be called with 'state' and '_id'
 * i.e. const previousSib = getPreviousSibling(allOfReduxState, idOfCurrentSib)
 */
export const getPreviousSibling = createSelector( // Start with redux 'reselect' selector
    /// These top three selectors gather the parameters used by the ormCreateSelector
    ormSelector, // Filter to just the orm state
    parentIdSelector, // Get the parent for the passed _id
    addIdAsInput, // Add passed _id into parameters used by ormCreateSelector
    ormCreateSelector(
        orm, // Pass in the instance of redux-orm.ORM object with our configuration
        state=>state, // Set the initial state -- I have no idea why this is necessary - it doesn't seem to be in the docs really.
        // The next two selectors gather parameters used by the last selector (similar to the first three in the 'reselect' selector above)
        (ormState, parentId, _id) => {return _id}, // Get the original `_id` from the parameters created above.
        (ormState, parentId)=>childrenForParentId({orm:ormState}, parentId), // Get all the children (`parentChildren`) for the parentId selected above -- notice that I had to rewrap the state with an 'orm' key because the 'childrenForParentId' selector expect that.
        (session, _id, parentChildren) => {
            // parentChildren are sorted by sequence, so just get the child previous
            // to the child with our original `_id`
            return parentChildren.reduce((result, pc, i)=>{
                if (pc._id === _id) return parentChildren[i-1];
                else return result;
            }, undefined);
        }
    )
);

export const getNextSibling = createSelector(
    ormSelector, // Filter to just the orm state
    parentIdSelector, // Get the parent for the passed _id
    addIdAsInput, // Add passed _id into parameters used by ormCreateSelector
    ormCreateSelector(
        orm, // Pass in the instance of redux-orm.ORM object with our configuration
        (session, parentId, _id) =>{
            let children;
            if (!parentId) {
                children = session.Model.filter({parent:undefined}).orderBy('sequence').toRefArray();
            } else {
                const parent = session.Model.withId(parentId);
                children = parent.children.orderBy('sequence').toRefArray();
            }
            return children.reduce((result, child, i)=>{
                if (child._id === _id) return (children[i+1] ? children[i+1] : undefined );
                return result;
            }, undefined)
        }
    )
);

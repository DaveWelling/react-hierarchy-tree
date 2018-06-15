import { orm } from '../index';
import { createSelector } from 'reselect';
import { createSelector as ormCreateSelector } from 'redux-orm';

// Selects the state managed by Redux-ORM.
export const ormSelector = state => state.orm;

// Redux-ORM selectors work with reselect. To feed input
// selectors to a Redux-ORM selector, we use the reselect `createSelector`.
export const childrenForParentId = createSelector(
    // The first input selector should always be the orm selector.
    // Behind the scenes, `schema.createSelector` begins a Redux-ORM
    // session with the state selected by `ormSelector` and passes
    // that Session instance as an argument instead.
    // So, `orm` is a Session instance.
    ormSelector,
    (state, parentId)=>parentId,
    ormCreateSelector(orm, (session, parentId) => {
        console.log('Running children selector');

        // We could also do orm.User.withId(userId).todos.map(...)
        // but this saves a query on the User table.
        //
        // `.withRefs` means that the next operation (in this case filter)
        // will use direct references from the state instead of Model instances.
        // If you don't need any Model instance methods, you should use withRefs.
        if (!parentId) return session.Event.filter({parentId:undefined}).orderBy('sequence').toRefArray();
        return session.Event.filter(e=>e.parentId && e.parentId === parentId).orderBy('sequence').toRefArray();
    })
);

export const event = createSelector(
    ormSelector,
    ormCreateSelector(orm, (session) => {
        console.log('Running user selector');
        // .ref returns a reference to the plain
        // JavaScript object in the store.
        return session.event.withId(selectedUserId).ref;
    })
);

// export const users = createSelector(
//     ormSelector,
//     ormCreateSelector(orm, session => {
//         console.log('Running users selector');

//         // `.toRefArray` returns a new Array that includes
//         // direct references to each User object in the state.
//         return session.User.all().toRefArray();
//     })
// );
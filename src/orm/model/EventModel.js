import { ORM, Model, many, fk, attr } from 'redux-orm';
import { PropTypes } from 'react';
import propTypesMixin from 'redux-orm-proptypes';

const ValidatingModel = propTypesMixin(Model);

export class Event extends ValidatingModel{
    static reducer(action, Event, session) {
        const { type } = action;
        switch (type) {
            case 'CREATE_NOVEL_EVENT':
                let newModel = Event.create(action.create.newEvent);
                break;
            case 'UPDATE_NOVEL_EVENT':
                const { update:{changes}} = action;
                Event.withId(action.update._id).update(changes);
                break;
            case 'REMOVE_NOVEL_EVENT':
                Event.withId(action.delete._id).delete();
                break;
            case 'TRANSFER_NOVEL_EVENT':
                const { transfer:{currentParentId, newParentId}} = action;
                Event.withId(currentParentId).children.update({parentId:newParentId});
                break;
        }
    }
}
Event.options = {
    idAttribute: '_id'
}
Event.modelName = 'Event';
Event.fields = {
    _id: attr(),
    title: attr(),
    parentId: fk('Event', 'children')
}

export default Event;
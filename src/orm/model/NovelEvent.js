import { ORM,  Model as BaseModel, many, fk, attr } from 'redux-orm';
import { PropTypes } from 'react';
import propTypesMixin from 'redux-orm-proptypes';
import moment from 'moment';

const ValidatingModel = propTypesMixin(BaseModel);

export class Event extends ValidatingModel{
    static reducer(action, Event, session) {
        const { type } = action;
        switch (type) {
            case 'CREATE_NOVEL_EVENT':
                let newEvent = Event.create(action.create.newEvent);
                break;
            case 'UPDATE_NOVEL_EVENT':
                const { update:{changes}} = action;
                Event.withId(action.update._id).update(changes);
                break;
            case 'REMOVE_NOVEL_EVENT':
                Event.withId(action.remove._id).delete();
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
    timing: attr({getDefault: ()=>moment()}),
    description: attr()
}

export default Event;
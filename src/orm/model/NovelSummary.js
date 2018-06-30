import { ORM,  Model as BaseModel, many, fk, attr } from 'redux-orm';
import { PropTypes } from 'react';
import propTypesMixin from 'redux-orm-proptypes';

const ValidatingModel = propTypesMixin(BaseModel);

export class Summary extends ValidatingModel{
    static reducer(action, Summary, session) {
        const { type } = action;
        switch (type) {
            case 'CREATE_NOVEL_SUMMARY':
                let newSummary = Summary.create(action.create.newSummary);
                break;
            case 'UPDATE_NOVEL_SUMMARY':
                const { update:{changes}} = action;
                Summary.withId(action.update._id).update(changes);
                break;
            case 'REMOVE_NOVEL_SUMMARY':
                Summary.withId(action.remove._id).delete();
                break;
        }
    }
}
Summary.options = {
    idAttribute: '_id'
}
Summary.modelName = 'Summary';
Summary.fields = {
    _id: attr(),
    text: attr()
}

export default Summary;
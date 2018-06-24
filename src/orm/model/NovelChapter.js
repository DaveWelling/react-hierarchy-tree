import { ORM,  Model as BaseModel, many, fk, attr } from 'redux-orm';
import { PropTypes } from 'react';
import propTypesMixin from 'redux-orm-proptypes';

const ValidatingModel = propTypesMixin(BaseModel);

export class Chapter extends ValidatingModel{
    static reducer(action, Chapter, session) {
        const { type } = action;
        switch (type) {
            case 'CREATE_NOVEL_CHAPTER':
                let newChapter = Chapter.create(action.create.newChapter);
                break;
            case 'UPDATE_NOVEL_CHAPTER':
                const { update:{changes}} = action;
                Chapter.withId(action.update._id).update(changes);
                break;
            case 'REMOVE_NOVEL_CHAPTER':
                Chapter.withId(action.remove._id).delete();
                break;
        }
    }
}
Chapter.options = {
    idAttribute: '_id'
}
Chapter.modelName = 'Chapter';
Chapter.fields = {
    _id: attr(),
    text: attr()
}

export default Chapter;
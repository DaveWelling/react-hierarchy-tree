import { ORM,  Model as BaseModel, many, fk, attr } from 'redux-orm';
import { PropTypes } from 'react';
import propTypesMixin from 'redux-orm-proptypes';
import config from '../../config';

const ValidatingModel = propTypesMixin(BaseModel);

export class Model extends ValidatingModel{
    static reducer(action, Model, session) {
        const { type } = action;
        switch (type) {
            case 'CREATE_NOVEL_MODEL':
                let newModel = Model.create(action.create.newModel);
                break;
            case 'UPDATE_NOVEL_MODEL':
                const { update:{changes}} = action;
                Model.withId(action.update._id).update(changes);
                break;
            case 'REMOVE_NOVEL_MODEL':
                Model.withId(action.remove._id).delete();
                break;
            case 'TRANSFER_NOVEL_MODEL':
                const { transfer:{currentParentId, newParentId}} = action;
                Model.withId(currentParentId).children.update({parent:newParentId});
                break;
            case 'RESEQUENCE_NOVEL_MODEL':
                const {_id, parentId, position} = action.resequence;
                const children = Model.withId(parentId).children;
                let newSequence;
                if (children) {
                    if (position === 'end') {
                        const max = children.toRefArray().reduce((max, child)=>Math.max(max, child.sequence), 0);
                        newSequence = max + 1;
                        Model.withId(_id).update({sequence: newSequence});
                    }
                }
        }

        // UI actions
        switch (type) {
            case 'DRAG_NOVEL_MODEL_START': {
                const model = Model.withId(action.drag.model._id);
                model.update({
                    ui: {
                        collapsed: true,
                        beforeDrag: action.drag.model.ui.collapsed
                    }
                });
                break;
            }
            case 'DRAG_NOVEL_MODEL_END': {
                const model = Model.withId(action.drag.model._id);
                model.update({
                    ui: {
                        collapsed: action.drag.model.ui.beforeDrag
                    }
                });
                break;
            }
            case 'toggleCollapse_novel_model': {
                const model = Model.withId(action.toggleCollapse._id);
                model.update({ui: {collapsed: !model.ui.collapsed}});
                break;
            }
            case 'expand_novel_model': {
                const model = Model.withId(action.expand._id);
                model.update({ui: {collapsed: false}});
                break;
            }
            case 'collapse_novel_model': {
                const model = Model.withId(action.collapse._id);
                model.update({ui: {collapsed: true}});
                break;
            }
            case 'EnsureExpanded_novel_model': {
                const model = Model.withId(action.ensureExpanded._id);
                function expandToRoot(expandingModel){
                    expandingModel.ui.collapsed = false;
                    if (expandingModel.parent) {
                        expandToRoot(expandingModel.parent);
                    }
                }
                if (model.parent) expandToRoot(model.parent);
                break;
            }
            case 'FOCUS_NOVEL_MODEL': {
                const {_id, selectionStart, selectionEnd} = action.focus;
                const model = Model.withId(_id);
                model.update({ui: {...model.ui, selectionStart, selectionEnd}})
                break;
            }
        }
    }
}
Model.options = {
    idAttribute: '_id'
}
Model.modelName = 'Model';
Model.fields = {
    _id: attr(),
    title: attr(),
    type: attr({getDefault: ()=>config.defaultModelType}),
    ui: attr({getDefault: ()=>({collapsed: true})}),
    parent: fk('Model', 'children')
}

export default Model;
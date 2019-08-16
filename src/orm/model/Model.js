import { ORM,  Model as BaseModel, many, fk, attr } from 'redux-orm';
import { PropTypes } from 'react';
import propTypesMixin from 'redux-orm-proptypes';
import config from '../../config';
const ValidatingModel = propTypesMixin(BaseModel);

export class Model extends ValidatingModel{
    static reducer(action, Model, session) {
        const { type } = action;
        switch (type) {
            case 'create_project_model':
                let newModel = Model.create(action.create.newModel);
                break;
            case 'update_project_model':
                const { update:{changes}} = action;
                Model.withId(action.update._id).update(changes);
                break;
            case 'remove_project_model':
                Model.withId(action.remove._id).delete();
                break;
            case 'transfer_project_model':
                const { transfer:{currentParentId, newParentId}} = action;
                Model.withId(currentParentId).children.update({parent:newParentId});
                break;
            case 'resequence_project_model':
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
            case 'drag_project_model_start': {
                const model = Model.withId(action.drag.model._id);
                model.update({
                    ui: {
                        collapsed: true,
                        beforeDrag: action.drag.model.ui.collapsed
                    }
                });
                break;
            }
            case 'drag_project_model_end': {
                const model = Model.withId(action.drag.model._id);
                model.update({
                    ui: {
                        collapsed: action.drag.model.ui.beforeDrag
                    }
                });
                break;
            }
            case 'toggleCollapse_project_model': {
                const model = Model.withId(action.toggleCollapse._id);
                model.update({ui: {collapsed: !model.ui.collapsed}});
                break;
            }
            case 'expand_project_model': {
                const model = Model.withId(action.expand._id);
                model.update({ui: {collapsed: false}});
                break;
            }
            case 'collapse_project_model': {
                const model = Model.withId(action.collapse._id);
                model.update({ui: {collapsed: true}});
                break;
            }
            case 'ensureExpanded_project_model': {
                const model = Model.withId(action.ensureExpanded._id);
                function expandToRoot(expandingModel){
                    expandingModel.ui.collapsed = false;
                    if (expandingModel.parent != undefined) {
                        expandToRoot(expandingModel.parent);
                    }
                }
                if (model.parent) expandToRoot(model.parent);
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
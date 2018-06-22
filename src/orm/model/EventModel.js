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
                Event.withId(action.remove._id).delete();
                break;
            case 'TRANSFER_NOVEL_EVENT':
                const { transfer:{currentParentId, newParentId}} = action;
                Event.withId(currentParentId).children.update({parent:newParentId});
                break;
            case 'RESEQUENCE_NOVEL_EVENT':
                const {_id, parentId, position} = action.resequence;
                const children = Event.withId(parentId).children;
                let newSequence;
                if (children) {
                    if (position === 'end') {
                        const max = children.toRefArray().reduce((max, child)=>Math.max(max, child.sequence), 0);
                        newSequence = max + 1;
                        Event.withId(_id).update({sequence: newSequence});
                    }
                }
        }

        // UI events
        switch (type) {
            case 'DRAG_NOVEL_EVENT_START': {
                const event = Event.withId(action.drag.event._id);
                event.update({
                    ui: {
                        collapsed: true,
                        beforeDrag: action.drag.event.ui.collapsed
                    }
                });
                break;
            }
            case 'DRAG_NOVEL_EVENT_END': {
                const event = Event.withId(action.drag.event._id);
                event.update({
                    ui: {
                        collapsed: action.drag.event.ui.beforeDrag
                    }
                });
                break;
            }
            case 'toggleCollapse_novel_event': {
                const event = Event.withId(action.toggleCollapse._id);
                event.update({ui: {collapsed: !event.ui.collapsed}});
                break;
            }
            case 'expand_novel_event': {
                const event = Event.withId(action.expand._id);
                event.update({ui: {collapsed: false}});
                break;
            }
            case 'collapse_novel_event': {
                const event = Event.withId(action.collapse._id);
                event.update({ui: {collapsed: true}});
                break;
            }
            case 'EnsureExpanded_novel_event': {
                const event = Event.withId(action.ensureExpanded._id);
                function expandToRoot(expandingEvent){
                    expandingEvent.ui.collapsed = false;
                    if (expandingEvent.parent) {
                        expandToRoot(expandingEvent.parent);
                    }
                }
                if (event.parent) expandToRoot(event.parent);
                break;
            }
            case 'FOCUS_NOVEL_EVENT': {
                const {_id, selectionStart, selectionEnd} = action.focus;
                const event = Event.withId(_id);
                event.update({ui: {...event.ui, selectionStart, selectionEnd}})
                break;
            }
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
    ui: attr({getDefault: ()=>({collapsed: true})}),
    parent: fk('Event', 'children')
}

export default Event;
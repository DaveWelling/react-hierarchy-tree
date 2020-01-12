import React from 'react';
import './editView.css';
import config from '../config';
import {subscribe} from '../eventSink';
import ProjectContext from '../projectContext';

export default class EditView extends React.Component {
    constructor(props) {
        super(props);
        this.modelFocused = this.modelFocused.bind(this);
        this.unsubscribe = subscribe('focus_project_model', this.modelFocused);
        this.state = {
            model: {}
        };
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    modelFocused(action) {
        const {model} = action;
        if (this.state.model._id !== model._id || this.state.model.type !== model.type) {
            this.setState({model});
        }
    }

    render() {
        const {projectName} = this.context;
        const {model} = this.state;
        let toRender = <div>Select a node.</div>;
        if (model && model.type) {
            let ViewType = require('./' + getViewNameForModelType(model.type));
            if (ViewType.default) {
                ViewType = ViewType.default;
            }
            toRender = (<div className="edit-view">
                <ViewType model={model} projectName={projectName} />
            </div>);
        }
        return toRender;
    }
}

EditView.contextType = ProjectContext;

function getViewNameForModelType(type){
    const dataType = config.dataTypes.find(dt=>dt.title === type);
    return dataType.view;
}
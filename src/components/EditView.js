import React, {useContext, useEffect, useState} from 'react';
import './editView.css';
import config from '../config';
import {subscribe} from '../eventSink';
import ProjectContext from '../projectContext';

export default function EditView() {
    const context = useContext(ProjectContext);
    const [model, setModel] = useState();

    useEffect(()=>{
        return subscribe('focus_project_model', modelFocused);
    }, []);

    function modelFocused(action) {
        const {model: newModel} = action;
        if (!model || (model._id !== newModel._id || model.type !== newModel.type)) {
            setModel(newModel);
        }
    }

    const {projectName} = context;
    let toRender = <div className="default-message">Select a node to the left.</div>;
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

function getViewNameForModelType(type){
    const dataType = config.dataTypes.find(dt=>dt.title === type);
    return dataType.view;
}
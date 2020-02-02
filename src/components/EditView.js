import React, {useContext, useEffect, useState, useRef} from 'react';
import './editView.css';
import config from '../config';
import {subscribe} from '../eventSink';
import ProjectContext from '../projectContext';
import { getRepository } from '../database';
import cuid from 'cuid';
import * as logging from '../logging';
import { throttle } from 'lodash';

export default function EditView() {
    const context = useContext(ProjectContext);
    const model = useRef();
    const [loading, setLoading] = useState(false);
    const [subModel, setSubModel] = useState();

    useEffect(()=>{
        return subscribe('focus_project_model', modelFocused);
    }, []);

    function modelFocused(action) {
        if (!model.current || (model.current._id !== action.model._id || model.current.type !== action.model.type)) {
            model.current = action.model;
            loadStateForModel(action.model);
        }
    }

    function loadStateForModel(modelToLoadFor) {
        setLoading(true);
        getRepository(modelToLoadFor.type).then(repository => {
            return repository
                .find({ modelId: modelToLoadFor._id })
                .then(storedStates => {
                    if (storedStates.length > 1)
                        throw new Error(`There are (somehow) two ${modelToLoadFor.type} records for ${modelToLoadFor.title}`);
                    let storedState;
                    if (storedStates.length === 0) {
                        // If there isn't anything in the database, then create the initial entry.
                        storedState = {
                            _id: cuid(),
                            modelId: modelToLoadFor._id,
                            content: {}
                        };
                        return repository.create(storedState).then(() => {
                            // value for Slate to use is different from (stringified) storage value.
                            setSubModel(storedState);
                            setLoading(false);
                        });
                    } else {
                        // value for Slate to use is different from (stringified) storage value.
                        storedState = storedStates[0];
                        setSubModel(storedState);
                        setLoading(false);
                    }
                })
                .catch(err => logging.error(err));
        });
    }

    // Throttle because this will fire every time a user does something.
    const update = throttle(function update(newSubModel, modelType) {
        getRepository(modelType)
        .then(repository=>repository.update(newSubModel))
        .catch(err=>logging.error(err));
    }, 2000, { leading: false, trailing: true });

    if (loading) return <div className="default-message"> Loading ... </div>;

    const {projectName} = context;
    if (model.current && model.current.type) {
        let ViewType = require('./' + getViewNameForModelType(model.current.type));
        if (ViewType.default) {
            ViewType = ViewType.default;
        }
        return (<div className="edit-view">
            <ViewType update={(change=>update(change, model.current.type))} subModel={subModel} projectName={projectName} />
        </div>);
    }

    return <div className="default-message">Select a node to the left.</div>;
}

function getViewNameForModelType(type){
    const dataType = config.dataTypes.find(dt=>dt.title === type);
    return dataType.view;
}
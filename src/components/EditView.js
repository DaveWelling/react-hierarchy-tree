import React from 'react';
import './editView.css';
import {connect} from 'react-redux';
import {get} from 'lodash';
import config from '../config';

class EditView extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(changes){
        const {dispatch, model, model:{_id}} = this.props;


        dispatch({
            type: 'update_project_model',
            update: {
                _id,
                changes
            }
        });
    }
    render() {
        const {model, projectName} = this.props;
        const {onChange} = this;
        let toRender = <div>Select a node.</div>;
        if (model && model.type) {
            let ViewType = require('./' + getViewNameForModelType(model.type));
            if (ViewType.default) {
                ViewType = ViewType.default;
            }
            toRender = (<div className="edit-view">
                <ViewType model={model} projectName={projectName} onChange={onChange} />
            </div>);
        }
        return toRender;
    }
}

function mapStateToProps(state, ownProps){
    let model = get(state, 'project_model.model');
    const projectName = get(state, 'project_model.name');
    return {
        model,
        projectName
    };
}

export default connect(mapStateToProps)(EditView);

function getViewNameForModelType(type){
    const dataType = config.dataTypes.find(dt=>dt.title === type);
    return dataType.view;
}
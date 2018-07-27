import React from 'react';
import './editView.css';
import {connect} from 'react-redux';
import {get} from 'lodash';
import config from '../config';

class EditView extends React.Component {
    render() {
        const {model} = this.props;
        let toRender = <div>Select a node.</div>;
        if (model || model.type) {
            let ViewType = require('./' + getViewNameForModelType(model.type));
            if (ViewType.default) {
                ViewType = ViewType.default;
            }
            toRender = (<div className='edit-view'>
                <ViewType model={model}></ViewType>
            </div>);
        }
        return toRender;
    }
}

function mapStateToProps(state, ownProps){
    let model = get(state, 'app_model.model');
    return {
        model
    };
}

export default connect(mapStateToProps)(EditView);

function getViewNameForModelType(type){
    const dataType = config.dataTypes.find(dt=>dt.title === type);
    return dataType.view;
}
import React from 'react';
import './editView.css';
import {connect} from 'react-redux';
import {get} from 'lodash';
import config from './config';
import Chapter from './NovelChapterView';
import Event from './NovelEventView';

class EditView extends React.Component {
    render() {
        const {model} = this.props;
        return <div className='edit-view'>
            {(!model || !model.type) && <div>Select a node.</div>}
            {model.type === 'chapter' && <Chapter model={model}></Chapter>}
            {model.type === 'event' && <Event model={model}></Event>}
        </div>;
    }
}

function mapStateToProps(state, ownProps){
    let model = get(state, 'NOVEL_MODEL.model', {});
    return {
        model
    };
}

export default connect(mapStateToProps)(EditView);
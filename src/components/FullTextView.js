import React from 'react';
import './editView.css';
import {connect} from 'react-redux';
import {getModelRef} from '../orm/selector/modelSelectors';
import Quill from 'quill';
import {debounce} from 'lodash'
import './quill-editor.css';

class FullTextView extends React.Component {
    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onChange = debounce(this.onChange, 1000);
    }
    componentDidMount(){
        const text = this.props.model ? this.props.model.text : undefined;
        const quill = this.quill = new Quill(`#fullTextView_${this.props.model._id}`, {
            modules: {
                history: {
                  delay: 2000,
                  maxStack: 500,
                  userOnly: true
                }
              },
            theme: 'snow'
        });
        quill.setContents(text, 'silent');
        const {onChange} = this;
        quill.on('text-change', function() {
            onChange(quill);
        });
    }
    onChange(quill){
        const {isNew, dispatch, model:{_id}} = this.props;
        if (isNew) {
            dispatch({
                type: 'create_app_model',
                create: {
                    newChapter: {
                        _id,
                        text: quill.getContents()
                    }
                }
            });
        } else {
            dispatch({
                type: 'update_app_model',
                update: {
                    _id,
                    changes: {
                        text: quill.getContents()
                    }
                }
            });
        }
    }
    render() {
        return <div id={'fullTextView_' + this.props.model._id} />
    }
}

function mapStateToProps(state, ownProps){
    let model = getModelRef(state, ownProps.model._id);

    return {
        isNew: !model,
        model
    };
}

export default connect(mapStateToProps)(FullTextView);
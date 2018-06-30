import React from 'react';
import './editView.css';
import {connect} from 'react-redux';
import {getNovelSummary} from '../orm/selector/novelSummarySelectors';
import RichText from './RichText';
import './novelSummaryView.css';

class NovelSummaryView extends React.Component {
    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
    }
    onChange(e){
        const {isNew, dispatch, model:{_id}} = this.props;
        if (isNew) {
            dispatch({
                type: 'CREATE_NOVEL_SUMMARY',
                create: {
                    newSummary: {
                        _id,
                        text: e.target.value
                    }
                }
            });
        } else {
            dispatch({
                type: 'UPDATE_NOVEL_SUMMARY',
                update: {
                    _id,
                    changes: {
                        text: e.target.value
                    }
                }
            });
        }
    }
    render() {
        const meta = {
            id: 'rt_' + this.props.model._id,
            propertyName: 'richtext',
            mentionNamespace: 'novel',
            mentionRelation: 'event'
        };
        const text = this.props.novelSummary ? this.props.novelSummary.text : undefined;
        const {onChange} = this;
        return <RichText className='summary-rich-text' hNode={meta} onchange={onChange} value={text}></RichText>;
    }
}

function mapStateToProps(state, ownProps){
    let novelSummary = getNovelSummary(state, ownProps.model._id);

    return {
        isNew: !novelSummary,
        novelSummary
    };
}

export default connect(mapStateToProps)(NovelSummaryView);
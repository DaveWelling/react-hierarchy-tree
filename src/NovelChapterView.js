import React from 'react';
import './editView.css';
import {connect} from 'react-redux';
import {getNovelChapter} from './orm/selector/novelChapterSelectors';
import RichText from './RichText';
import './novelChapterView.css';

class NovelChapterView extends React.Component {
    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
    }
    onChange(e){
        const {isNew, dispatch, model:{_id}} = this.props;
        if (isNew) {
            dispatch({
                type: 'CREATE_NOVEL_CHAPTER',
                create: {
                    newChapter: {
                        _id,
                        text: e.target.value
                    }
                }
            });
        } else {
            dispatch({
                type: 'UPDATE_NOVEL_CHAPTER',
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
        const text = this.props.novelChapter ? this.props.novelChapter.text : undefined;
        const {onChange} = this;
        return <RichText className='chapter-rich-text' hNode={meta} onchange={onChange} value={text}></RichText>;
    }
}

function mapStateToProps(state, ownProps){
    let novelChapter = getNovelChapter(state, ownProps.model._id);

    return {
        isNew: !novelChapter,
        novelChapter
    };
}

export default connect(mapStateToProps)(NovelChapterView);
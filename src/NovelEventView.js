import React from 'react';
import './editView.css';
import {connect} from 'react-redux';
import {getNovelEvent} from './orm/selector/novelEventSelectors';
import RichText from './RichText';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import './novelEventView.css';
import 'react-datepicker/dist/react-datepicker.css';

class NovelEventView extends React.Component {
    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
    }
    onChange(e){
        const {isNew, dispatch, model:{_id}} = this.props;
        let {timing, description} = this.props.novelEvent;
        if (e instanceof moment) {
            timing = e;
        } else {
            description = e.target.value;
        }
        if (isNew) {
            dispatch({
                type: 'CREATE_NOVEL_EVENT',
                create: {
                    newEvent: {
                        _id,
                        timing,
                        description
                    }
                }
            });
        } else {
            dispatch({
                type: 'UPDATE_NOVEL_EVENT',
                update: {
                    _id,
                    changes: {
                        timing,
                        description
                    }
                }
            });
        }
    }
    render() {
        let {description, timing} = this.props.novelEvent;
        const meta = {
            id: 'rt_' + this.props.model._id,
            propertyName: 'richtext',
            mentionNamespace: 'novel',
            mentionRelation: 'event'
        };

        const {onChange} = this;
        timing = timing || moment();
        return <form >
            <DatePicker
                onChange={onChange}
                selected={timing}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="LLL"
                timeCaption="time"/>
            <RichText className="form-rich-text" hNode={meta} onchange={onChange} value={description}></RichText>
        </form>;
    }
}

function mapStateToProps(state, ownProps){
    let novelEvent = getNovelEvent(state, ownProps.model._id);
    return {
        isNew: !novelEvent,
        novelEvent: novelEvent || {}
    };
}


export default connect(mapStateToProps)(NovelEventView);
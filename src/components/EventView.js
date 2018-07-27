import React from 'react';
import Quill from 'quill';
import {connect} from 'react-redux';
import {getModelRef} from '../orm/selector/modelSelectors';
import DatePicker from 'react-datepicker';
import {debounce} from 'lodash'
import moment from 'moment';
import './editView.css';
import './eventView.css';
import './quill-editor.css';
import 'react-datepicker/dist/react-datepicker.css';
class EventView extends React.Component {
    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onChangeDebounced = debounce(this.onChange, 1000);
    }
    componentDidMount(){
        const text = this.props.model ? this.props.model.text : undefined;
        const quill = this.quill = new Quill(`#formTextView_${this.props.model._id}`, {
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
        const {onChangeDebounced} = this;
        quill.on('text-change', function() {
            onChangeDebounced(quill);
        });
    }
    onChange(e){
        const {isNew, dispatch, model:{_id}} = this.props;
        let {timing, description} = this.props.model;
        if (e instanceof moment) {
            timing = e;
        } else {
            description = e.getContents();
        }
        if (isNew) {
            dispatch({
                type: 'create_app_model',
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
                type: 'update_app_model',
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
        let {description, timing} = this.props.model;

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
            <div id={'formTextView_' + this.props.model._id} />
        </form>;
    }
}

function mapStateToProps(state, ownProps){
    let model = getModelRef(state, ownProps.model._id);

    return {
        isNew: !model,
        model
    };
}


export default connect(mapStateToProps)(EventView);
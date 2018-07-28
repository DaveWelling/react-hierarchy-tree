import React from 'react';
import Quill from 'quill';
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
        const description = this.props.model ? this.props.model.description : undefined;
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
        quill.setContents(description, 'silent');
        const {onChangeDebounced} = this;
        quill.on('text-change', function() {
            onChangeDebounced(quill);
        });
    }
    componentDidUpdate(prevProps){
        const {description} = this.props.model;
        if (prevProps.model.description !== description) {
            this.quill.setContents(description);
        }
    }
    onChange(e){
        let {timing, description} = this.props.model;
        if (e instanceof moment) {
            timing = e;
        } else {
            description = e.getContents();
        }

        this.props.onChange({
            timing,
            description
        })
    }
    render() {
        let {timing} = this.props.model;

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



export default EventView;
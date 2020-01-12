import React from 'react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import './editView.css';
import './eventView.css';
import 'react-datepicker/dist/react-datepicker.css';
import FullTextView from './FullTextView';
import '../App.css';

export default class EventView extends React.Component {
    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(e){
        let {timing, description} = this.props.model;
        if (e instanceof moment) {
            timing = e;
        } else {
            description = e.value;
        }

        this.props.onChange({
            timing,
            description
        })
    }

    render() {
        let {timing, description} = this.props.model;

        const {onChange} = this;
        timing = timing || moment();
        return (<form className="fullHeight" >
            <DatePicker
                onChange={onChange}
                selected={timing}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="LLL"
                timeCaption="time"/>
            <FullTextView text={description} onChange={this.onChange}/>
        </form>);
    }
}
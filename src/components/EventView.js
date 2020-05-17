import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import DatePicker from 'react-datepicker';
import './editView.css';
import './eventView.css';
import 'react-datepicker/dist/react-datepicker.css';
import FullTextView from './FullTextView';
import '../App.css';

export default function EventView({ subModel, update }) {
    const [timing, setTiming] = useState(new Date(get(subModel, 'content.timing')));

    function onChange(e) {
        if (!(e instanceof Date)) {
            throw new Error('What happened here?');
        }
        setTiming(e);
        update({
            ...subModel,
            content: { ...subModel.content, timing: e }
        });
    }

    return (
        <form className="fullHeight">
            <DatePicker
                onChange={onChange}
                selected={timing}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                timeCaption="time"
            />
            <FullTextView subModel={subModel} update={update} />
        </form>
    );
}

EventView.propTypes = {
    subModel: PropTypes.object.isRequired,
    update: PropTypes.func.isRequired
};

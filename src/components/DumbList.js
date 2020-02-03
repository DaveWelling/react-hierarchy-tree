import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import cuid from 'cuid';

export default function DumbList({subModel, update}) {
    const [list, setList] = useState(get(subModel, 'content.list',[]));
    const [textToAdd, setTextToAdd]= useState('');
    function addText(e) {
        setTextToAdd(e.target.value);
    }
    function addTextToList() {
        setList([
            ...list,
            { _id: cuid(), title:textToAdd}
        ]);
        setTextToAdd('');
    }
    function removeTextFromList(id) {
        const indexOf = list.findIndex(l=>l._id === id);
        const newList = [...list];
        newList.splice(indexOf, 1);
        setList(newList);
    }
    // update not implemented
    return (
        <div>
            {list.map(l=>{
                return (<div key={l._id} style={{display:'flex', padding: '1em'}}>
                    <div style={{paddingRight: '1em'}} >{l.title}</div>
                    <input type="button" value="-" onClick={()=>removeTextFromList(l._id)}/>
                </div>);
            })}
            <div style={{padding:'1em'}}>
                <input type="textbox" value={textToAdd} onChange={addText}/>
                <input type="button" value="+" onClick={addTextToList}/>
            </div>
        </div>
    );
}
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import cuid from 'cuid';
import database from '../database';
import logging from '../logging';

export default function ReactiveList({subModel}) {
    const [textToAdd, setTextToAdd]= useState('');
    const [widgets, setWidgets] = useState({_id: subModel.modelId, list:[]});
    const unsubscribe = useRef();

    useEffect(()=>{
        async function startupSubscription() {
            try {
                const repository = await database.getRepository('ReactiveList');

                unsubscribe.current = repository.onChange(subModel.modelId, setWidgets);

                const existing = await repository.get(subModel.modelId);
                if (!existing) {
                    await repository.create(widgets);
                } else {
                    setWidgets(existing);
                }
            } catch (err) {
                logging.error(err);
            }
        }
        startupSubscription();
        return ()=>unsubscribe.current();
    }, []);

    async function setList(list) {
        try {
        const repository = await database.getRepository('ReactiveList');
        await repository.update(subModel.modelId, 'list', list, true);
        } catch (err) {
            logging.error(err);
        }
    }

    function addText(e) {
        setTextToAdd(e.target.value);
    }

    function addTextToList() {
        setList([
            ...widgets.list,
            { _id: cuid(), title:textToAdd}
        ]);
        setTextToAdd('');
    }

    function removeTextFromList(id) {
        const newList = [...widgets.list];
        const indexOf = newList.findIndex(l=>l._id === id);
        newList.splice(indexOf, 1);
        setList(newList);
    }

    return (
        <div>
            {widgets.list.map(l=>{
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

ReactiveList.propTypes = {
    subModel: PropTypes.object.isRequired
}
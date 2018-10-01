import React from 'react';
import Meter from './Meter';
import './line.css';

export default (props)=>{
    const {line, lineChange} = props;
    const {words} = line;
    return <div className='line'>
        <div className='words'>
            {words && words.map((w,i)=>{
                return <div key={i} className='word'>
                    <Meter word={w}/>
                    {w.text}
                </div>
            })}
        </div>
        <input type='textbox' value={line.text} onChange={(e)=>lineChange(line, e.target.value)} />
    </div>
}
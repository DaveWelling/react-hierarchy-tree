import React from 'react';
import Line from './Line';
import cuid from 'cuid';
import './poemView.css';

class PoemView extends React.Component {
    constructor(props){
        super(props) ;
        this.lineChange = this.lineChange.bind(this);
    }
    lineChange(line, lineText) {
        let lines = this.props.model.lines || [];
        const lineIndex = lines.findIndex(l=>l.id === line.id);
        const newLine = updateLine(line, lineText);
        let before = [], after = [];
        if (lineIndex > 0) {
            before = lines.slice(0, lineIndex);
        }
        if ((lineIndex + 1) < lines.length){
            after = lines.slice(lineIndex + 1);
        }
        let newLines = [
            ...before,
            newLine,
            ...after
        ]
        this.props.onChange({
            lines: newLines
        });
    }
    render(){
        const lines = this.props.model.lines || [{
            id: cuid(),
            sequence: 0,
            text: ''
        }];
        return <div className='poem'>
            {lines.map(l=><Line key={l.sequence} line={l} lineChange={this.lineChange}/>)}
        </div>
    }
}

export default PoemView;

function updateLine(line, text) {
    const newWords = text.match(/\b(\w+|')\b/g)

    const words = newWords.map(text=>{
        return {
            meter: getMeter(text),
            text
        }
    });
    return {
        words,
        text
    };
}

function getMeter(wordText) {
    return 'dunno';
}
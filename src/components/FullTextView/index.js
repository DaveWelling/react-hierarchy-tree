import React, {useRef, useState} from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import { isKeyHotkey } from 'is-hotkey';
import components from './components';
import './fullTextView.css';
import {get} from 'lodash';
const { BlockToolbar, RenderMark, RenderBlock } = components;
const initialValue = {
    document: {
        nodes: [
            {
                object: 'block',
                type: 'paragraph',
                nodes: [
                    {
                        object: 'text',
                        text: ''
                    }
                ]
            }
        ]
    }
};


/**
 * Define hotkey matchers.
 *
 * @type {Function}
 */
const isBoldHotkey = isKeyHotkey('mod+b');
const isItalicHotkey = isKeyHotkey('mod+i');
const isUnderlinedHotkey = isKeyHotkey('mod+u');
const isCodeHotkey = isKeyHotkey('mod+`');

export default function FullTextView({subModel, update}) {
    const editorRef = useRef();
    const [editorState, setEditorState] = useState(
        Value.fromJSON(
            get(subModel, 'content.text', initialValue)
        )
    );

    async function onChange({ value: newEditorState }) {
        // The editor state can change without creating state we care about storing.
        // We only care about the document.
        if (newEditorState.document !== editorState.document) {
            const newSubModel = {...subModel, content: {...subModel.content, text: newEditorState.toJSON()}};
            update(newSubModel);
        }
        setEditorState(newEditorState);
    }

    /**
     * On key down, if it's a formatting command toggle a mark.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @return {Change}
     */
    function onKeyDown(event, editor, next) {
        let mark;

        if (isBoldHotkey(event)) {
            mark = 'bold';
        } else if (isItalicHotkey(event)) {
            mark = 'italic';
        } else if (isUnderlinedHotkey(event)) {
            mark = 'underlined';
        } else if (isCodeHotkey(event)) {
            mark = 'code';
        } else {
            return next();
        }

        event.preventDefault();
        editor.toggleMark(mark);
    }

    return (
        <div className="fullTextView">
            <BlockToolbar editor={editorRef.current} editorState={editorState} />
            <div style={{height: '100%', overflow:'auto'}}>
            <Editor
                id="slateEditor"
                className="editor"
                spellCheck
                placeholder="Begin writing here..."
                onChange={onChange}
                value={editorState}
                ref={editorRef}
                onKeyDown={onKeyDown}
                renderBlock={RenderBlock}
                renderMark={RenderMark}
            />
            </div>
        </div>
    );
}

FullTextView.propTypes = {
    subModel: PropTypes.object.isRequired,
    update: PropTypes.func.isRequired
};
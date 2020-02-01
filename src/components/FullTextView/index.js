import React, {useRef, useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import cuid from 'cuid';
import { getRepository } from '../../database';
import { throttle } from 'lodash';
import { isKeyHotkey } from 'is-hotkey';
import components from './components';
import './fullTextView.css';
import * as logging from '../../logging';
const { BlockToolbar, RenderMark, RenderBlock } = components;
const initialValue = Value.fromJSON({
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
});


/**
 * Define hotkey matchers.
 *
 * @type {Function}
 */
const isBoldHotkey = isKeyHotkey('mod+b');
const isItalicHotkey = isKeyHotkey('mod+i');
const isUnderlinedHotkey = isKeyHotkey('mod+u');
const isCodeHotkey = isKeyHotkey('mod+`');

export default function FullTextView({model}) {
    const editorRef = useRef();
    const [editorState, setEditorState] = useState(initialValue);
    const [storageState, setStorageState] = useState(initialValue.toJSON());
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        loadStateForModel(model);
    }, [model]);

    function loadStateForModel(model) {
        getRepository(model.type).then(repository => {
            return repository
                .find({ modelId: model._id })
                .then(storedStates => {
                    if (storedStates.length > 1)
                        throw new Error(`There are (somehow) two ${model.type} records for ${model.title}`);
                    let storedState;
                    if (storedStates.length === 0) {
                        // If there isn't anything in the database, then create the initial entry.
                        storedState = {
                            _id: cuid(),
                            modelId: model._id,
                            text: initialValue
                        };
                        return repository.create(storedState).then(() => {
                            // value for Slate to use is different from (stringified) storage value.
                            setStorageState(storedState);
                            setEditorState(Value.fromJSON(storedState.text));
                            setLoading(false);
                        });
                    } else {
                        // value for Slate to use is different from (stringified) storage value.
                        storedState = storedStates[0];
                        setEditorState(Value.fromJSON(storedState.text));
                        setStorageState(storedState);
                        setLoading(false);
                    }
                })
                .catch(err => logging.error(err));
        });
    }

    // Throttle because this will fire every time a user types something.
    const update = throttle(async function update(storageStateToChange, changeValue) {
        const content = changeValue.toJSON();
        storageStateToChange.text = content;
        return getRepository(model.type).then(repository=>repository.update(storageStateToChange));
    }, 2000, { loading: false });

    async function onChange({ value: newEditorState }) {
        // The editor state can change without creating state we care about storing.
        // We only care about the document.
        if (newEditorState.document !== editorState.document) {
            update(storageState, newEditorState).catch(err => {
                logging.error(err);
            });
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

    if (loading) return <div> Loading ... </div>;

    return (
        <div className="fullTextView">
            <BlockToolbar editor={editorRef.current} editorState={editorState} />
            <Editor
                className="editor"
                spellCheck
                autoFocus
                placeholder="Begin writing here..."
                onChange={onChange}
                value={editorState}
                ref={editorRef}
                onKeyDown={onKeyDown}
                renderBlock={RenderBlock}
                renderMark={RenderMark}
            />
        </div>
    );
}

FullTextView.propTypes = {
    model: PropTypes.object
};
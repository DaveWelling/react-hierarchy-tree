import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import cuid from 'cuid';
import { getRepository } from '../../database';
import { throttle } from 'lodash';
import { isKeyHotkey } from 'is-hotkey';
import { Button, Icon, Toolbar } from './components';
import './fullTextView.css';
import * as logging from '../../logging';

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
 * Define the default node type.
 *
 * @type {String}
 */
const DEFAULT_NODE = 'paragraph';

/**
 * Define hotkey matchers.
 *
 * @type {Function}
 */
const isBoldHotkey = isKeyHotkey('mod+b');
const isItalicHotkey = isKeyHotkey('mod+i');
const isUnderlinedHotkey = isKeyHotkey('mod+u');
const isCodeHotkey = isKeyHotkey('mod+`');

export default class FullTextView extends React.Component {
    constructor(props) {
        super(props);
        this.update = throttle(this.update.bind(this), 2000, { loading: false });
        this.onChange = this.onChange.bind(this);
        this.hasMark = this.hasMark.bind(this);
        this.hasBlock = this.hasBlock.bind(this);
        this.ref = this.ref.bind(this);
        this.renderMarkButton = this.renderMarkButton.bind(this);
        this.renderBlockButton = this.renderBlockButton.bind(this);
        this.renderBlock = this.renderBlock.bind(this);
        this.renderMark = this.renderMark.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onClickBlock = this.onClickBlock.bind(this);
        this.onClickMark = this.onClickMark.bind(this);
        this.loadStateForModel = this.loadStateForModel.bind(this);

        this.loadStateForModel(props.model);

        this.state = {
            loading: true
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.model._id !== prevProps.model._id) {
            this.loadStateForModel(this.props.model);
        }
    }

    loadStateForModel(model) {
        getRepository(model.type).then(repository => {
            return repository
                .find({ modelId: model._id })
                .then(textModels => {
                    if (textModels.length > 1)
                        throw new Error(`There are (somehow) two ${model.type} records for ${model.title}`);
                    let textModel;
                    if (textModels.length === 0) {
                        textModel = {
                            _id: cuid(),
                            modelId: model._id,
                            text: initialValue
                        };
                        return repository.create(textModel).then(() => {
                            // value for Slate to use is different from storage value.
                            this.setState({
                                textModel,
                                value: Value.fromJSON(textModel.text),
                                loading: false
                            });
                        });
                    } else {
                        textModel = textModels[0];
                        // value for Slate to use is different from storage value.
                        this.setState({
                            textModel,
                            value: Value.fromJSON(textModel.text),
                            loading: false
                        });
                    }
                })
                .catch(err => logging.error(err));
        });
    }

    async onChange({ value: changeValue }) {
        const { value, textModel } = this.state;
        if (changeValue.document !== value.document) {
            this.update(textModel, changeValue).catch(err => {
                logging.error(err);
            });
        }
        this.setState({ value: changeValue });
    }

    async update(textModel, changeValue) {
        const content = changeValue.toJSON();
        textModel.text = content;
        return getRepository(this.props.model.type).then(repository=>repository.update(textModel));
    }

    /**
     * Check if the current selection has a mark with `type` in it.
     *
     * @param {String} type
     * @return {Boolean}
     */
    hasMark(type) {
        const { value } = this.state;
        return value.activeMarks.some(mark => mark.type === type);
    }

    /**
     * Check if the any of the currently selected blocks are of `type`.
     *
     * @param {String} type
     * @return {Boolean}
     */
    hasBlock(type) {
        const { value } = this.state;
        return value.blocks.some(node => node.type === type);
    }

    /**
     * Store a reference to the `editor`.
     *
     * @param {Editor} editor
     */
    ref(editor) {
        this.editor = editor;
    }

    /**
     * Render a mark-toggling toolbar button.
     *
     * @param {String} type
     * @param {String} icon
     * @return {Element}
     */
    renderMarkButton(type, icon) {
        const isActive = this.hasMark(type);

        return (
            <Button active={isActive} onMouseDown={event => this.onClickMark(event, type)}>
                <Icon>{icon}</Icon>
            </Button>
        );
    }

    /**
     * Render a block-toggling toolbar button.
     *
     * @param {String} type
     * @param {String} icon
     * @return {Element}
     */
    renderBlockButton(type, icon) {
        let isActive = this.hasBlock(type);

        if (['numbered-list', 'bulleted-list'].includes(type)) {
            const {
                value: { document, blocks }
            } = this.state;

            if (blocks.size > 0) {
                const parent = document.getParent(blocks.first().key);
                isActive = this.hasBlock('list-item') && parent && parent.type === type;
            }
        }

        return (
            <Button active={isActive} onMouseDown={event => this.onClickBlock(event, type)}>
                <Icon>{icon}</Icon>
            </Button>
        );
    }

    /**
     * Render a Slate block.
     *
     * @param {Object} props
     * @return {Element}
     */
    renderBlock(props, editor, next) {
        const { attributes, children, node } = props;

        switch (node.type) {
            case 'block-quote':
                return <blockquote {...attributes}>{children}</blockquote>;
            case 'bulleted-list':
                return <ul {...attributes}>{children}</ul>;
            case 'heading-one':
                return <h1 {...attributes}>{children}</h1>;
            case 'heading-two':
                return <h2 {...attributes}>{children}</h2>;
            case 'list-item':
                return <li {...attributes}>{children}</li>;
            case 'numbered-list':
                return <ol {...attributes}>{children}</ol>;
            default:
                return next();
        }
    }

    /**
     * Render a Slate mark.
     *
     * @param {Object} props
     * @return {Element}
     */
    renderMark(props, editor, next) {
        const { children, mark, attributes } = props;

        switch (mark.type) {
            case 'bold':
                return <strong {...attributes}>{children}</strong>;
            case 'code':
                return <code {...attributes}>{children}</code>;
            case 'italic':
                return <em {...attributes}>{children}</em>;
            case 'underlined':
                return <u {...attributes}>{children}</u>;
            default:
                return next();
        }
    }

    /**
     * On key down, if it's a formatting command toggle a mark.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @return {Change}
     */
    onKeyDown(event, editor, next) {
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

    /**
     * When a mark button is clicked, toggle the current mark.
     *
     * @param {Event} event
     * @param {String} type
     */
    onClickMark(event, type) {
        event.preventDefault();
        this.editor.toggleMark(type);
    }

    /**
     * When a block button is clicked, toggle the block type.
     *
     * @param {Event} event
     * @param {String} type
     */
    onClickBlock(event, type) {
        event.preventDefault();

        const { editor } = this;
        const { value } = editor;
        const { document } = value;

        // Handle everything but list buttons.
        if (type !== 'bulleted-list' && type !== 'numbered-list') {
            const isActive = this.hasBlock(type);
            const isList = this.hasBlock('list-item');

            if (isList) {
                editor
                    .setBlocks(isActive ? DEFAULT_NODE : type)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            } else {
                editor.setBlocks(isActive ? DEFAULT_NODE : type);
            }
        } else {
            // Handle the extra wrapping required for list buttons.
            const isList = this.hasBlock('list-item');
            const isType = value.blocks.some(block => {
                return !!document.getClosest(block.key, parent => parent.type === type);
            });

            if (isList && isType) {
                editor
                    .setBlocks(DEFAULT_NODE)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            } else if (isList) {
                editor.unwrapBlock(type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list').wrapBlock(type);
            } else {
                editor.setBlocks('list-item').wrapBlock(type);
            }
        }
    }

    render() {
        const { value, loading } = this.state;
        if (loading) return <div> Loading ... </div>;

        return (
            <div className="fullTextView">
                <Toolbar>
                    {this.renderMarkButton('bold', 'format_bold')}
                    {this.renderMarkButton('italic', 'format_italic')}
                    {this.renderMarkButton('underlined', 'format_underlined')}
                    {this.renderMarkButton('code', 'code')}
                    {this.renderBlockButton('heading-one', 'looks_one')}
                    {this.renderBlockButton('heading-two', 'looks_two')}
                    {this.renderBlockButton('block-quote', 'format_quote')}
                    {this.renderBlockButton('numbered-list', 'format_list_numbered')}
                    {this.renderBlockButton('bulleted-list', 'format_list_bulleted')}
                </Toolbar>
                <Editor
                    className="editor"
                    spellCheck
                    autoFocus
                    placeholder="Begin writing here..."
                    onChange={this.onChange}
                    value={value}
                    ref={this.ref}
                    onKeyDown={this.onKeyDown}
                    renderBlock={this.renderBlock}
                    renderMark={this.renderMark}
                />
            </div>
        );
    }
}

FullTextView.propTypes = {
    model: PropTypes.object
};
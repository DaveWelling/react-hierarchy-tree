import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
import createInlineToolbarPlugin, { Separator } from 'draft-js-inline-toolbar-plugin';
import {
    ItalicButton,
    BoldButton,
    UnderlineButton,
    UnorderedListButton,
    OrderedListButton,
    BlockquoteButton
} from 'draft-js-buttons';

import 'draft-js-mention-plugin/lib/plugin.css';
import 'draft-js-inline-toolbar-plugin/lib/plugin.css';
import './richText.css';
import SuggestionEntry from './SuggestionEntry';
import MentionSuggestions from './MentionSuggestions';
import { debounce, get } from 'lodash';

const mentionTagTypes = ['event', 'before', 'after'].map(tt => ({ name: tt }));

export class RichText extends Component {
    constructor(props) {
        super(props);
        const mentionPlugin = createMentionPlugin({
            mentionSuggestionsComponent: MentionSuggestions,
            entityMutability: 'IMMUTABLE',
            mentionRegExp: '[\\w:]*'
        });
        // TODO:  Implement linking to mentioned events like this:
        // this.mentionPlugin = createMentionPlugin({
        //     mentionComponent: (mentionProps) => (
        //       <span
        //         className={mentionProps.className}
        //         onClick={() => <Code to navigate to event link>}
        //       >
        //         {mentionProps.children}
        //       </span>
        //     ),
        //     mentionSuggestionsComponent: MentionSuggestions
        //     entityMutability: 'IMMUTABLE',
        //     mentionRegExp: '[\\w:]*'
        // });

        const inlineToolbarPlugin = createInlineToolbarPlugin({
            structure: [
                BoldButton,
                ItalicButton,
                UnderlineButton,
                Separator,
                UnorderedListButton,
                OrderedListButton,
                BlockquoteButton
            ]
        });
        this.MentionSuggestionsOuter = mentionPlugin.MentionSuggestions;
        this.InlineToolbar = inlineToolbarPlugin.InlineToolbar;
        this.plugins = [mentionPlugin, inlineToolbarPlugin];

        let editorState = props.value
            ? EditorState.createWithContent(convertFromRaw(props.value))
            : EditorState.createEmpty();
        this.state = {
            editorState,
            suggestions: mentionTagTypes
        };

        this.onChange = this.onChange.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
        this.focus = this.focus.bind(this);
        this.sendToModel = this.sendToModel.bind(this);
        this.submitSearchFilter = this.submitSearchFilter.bind(this);
        this.setSuggestions = this.setSuggestions.bind(this);

        this.sendToModel = debounce(this.sendToModel, 250);
    }

    componentWillReceiveProps(newProps) {
        // if mentions reference has been changed.
        if (newProps.mentions !== this.props.mentions) {
            this.setSuggestions(newProps.mentions);
        }
    }

    onChange(editorState) {
        this.setState({
            editorState
        });
        this.sendToModel(editorState);
    }

    sendToModel(editorState) {
        let contentState = editorState.getCurrentContent();
        let raw = convertToRaw(contentState);
        this.props.onchange({
            target: {
                name: this.props.hNode.propertyName,
                value: raw
            }
        });
    }

    setSuggestions(mentions) {
        let { tagTypeFound, tagType } = this.state;
        let {
            hNode: { mentionPropertyName }
        } = this.props;
        if (tagTypeFound) {
            this.setState({
                suggestions: mentions.map(mention => ({
                    name: mention[mentionPropertyName].replace(/ /g, '_'),
                    type: tagType,
                    data: { originalName: mention[mentionPropertyName], mention }
                }))
            });
        }
    }

    onSearchChange({ value }) {
        let [tag, search] = value.split(':');
        if (tagTypeFound(tag)) {
            this.setState({
                tagType: tag,
                tagTypeFound: true
            });
            // There is a portion of the mention to use as a search filter;
            if (typeof search === 'string') {
                this.submitSearchFilter(search.trim()); // set new search filter
            } else {
                this.setSuggestions(this.props.mentions);
                this.submitSearchFilter('');
            }
        } else {
            // There is only the tag type portion
            this.setState({
                tagType: '',
                tagTypeFound: false,
                suggestions: defaultSuggestionsFilter(value, mentionTagTypes)
            });
        }

        function tagTypeFound(value) {
            return mentionTagTypes.includes(value);
        }
    }

    submitSearchFilter(searchText) {
        let {
            currentRoute,
            dispatch,
            hNode: { mentionNamespace, mentionRelation }
        } = this.props;
        dispatch({
            type: `FILTER_${mentionNamespace}_${mentionRelation}`,
            filter: {
                filters: {
                    fullTextSearch: {
                        searchTerm: searchText
                    }
                },
                routePath: currentRoute
            }
        });
    }

    focus() {
        this.editor.focus();
    }

    render() {
        const that = this;
        const {
            InlineToolbar,
            MentionSuggestionsOuter,
            plugins,
            onChange,
            focus,
            onSearchChange,
            onAddMention,
            state: { editorState, suggestions }
        } = this;
        const {
            hNode: { id, readOnly, propertyName },
            submitting,
            elementErrors
        } = this.props;
        const passedClassName = this.props.className;
        return (
            <div id={id} className={'rtfEditor ' + passedClassName} onClick={focus}>
                <Editor
                    editorState={editorState}
                    onChange={onChange}
                    plugins={plugins}
                    ref={function(element) {
                        that.editor = element;
                    }}
                    spellCheck="true"
                    readOnly={submitting || readOnly}
                    name={propertyName}
                />
                <InlineToolbar />
                <MentionSuggestionsOuter
                    onSearchChange={onSearchChange}
                    suggestions={suggestions}
                    onAddMention={onAddMention}
                    entryComponent={SuggestionEntry}
                />
            </div>
        );
    }
}

RichText.propTypes = {
    hNode: PropTypes.object.isRequired,
    value: PropTypes.object,
    elementErrors: PropTypes.array,
    submitting: PropTypes.bool,
    onchange: PropTypes.func,
    mentions: PropTypes.array,
    currentRoute: PropTypes.string,
    dispatch: PropTypes.func
};

const mapStateToProps = (state, ownProps) => {
    let { mentionNamespace, mentionRelation, id } = ownProps.hNode;
    let mentions = get(state, `${mentionNamespace}.${mentionRelation}.items`, []);
    return {
        id,
        mentions
    };
};

export default connect(mapStateToProps)(RichText);

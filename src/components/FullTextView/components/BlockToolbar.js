/* eslint react/no-multi-comp: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { Toolbar } from './copiedEmotionComponents';
import MarkButton from './MarkButton';
import BlockButton from './BlockButton';

export default function BlockToolbar({editor}) {
    return (
        <Toolbar>
            <MarkButton editor={editor} type="bold" icon="format_bold" />
            <MarkButton editor={editor} type="italic" icon="format_italic" />
            <MarkButton editor={editor} type="underlined" icon="format_underlined" />
            <MarkButton editor={editor} type="code" icon="code" />
            <BlockButton editor={editor} type="heading-one" icon="looks_one" />
            <BlockButton editor={editor} type="heading-two" icon="looks_two" />
            <BlockButton editor={editor} type="block-quote" icon="format_quote" />
            <BlockButton editor={editor} type="numbered-list" icon="format_list_numbered" />
            <BlockButton editor={editor} type="bulleted-list" icon="format_list_bulleted" />
        </Toolbar>
    );
}

BlockToolbar.propTypes = {
    editor: PropTypes.object
};
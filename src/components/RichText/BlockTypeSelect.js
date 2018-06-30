import React from 'react';

import {
    ItalicButton,
    BoldButton,
    UnderlineButton,
    UnorderedListButton,
    OrderedListButton,
    BlockquoteButton
} from 'draft-js-buttons';

import BlockTypeSelect from 'draft-js-side-toolbar-plugin/lib/components/BlockTypeSelect';

const DefaultBlockTypeSelect = ({ getEditorState, setEditorState, theme }) => (
  <BlockTypeSelect
    getEditorState={getEditorState}
    setEditorState={setEditorState}
    theme={theme}
    structure={[
        BoldButton,
        ItalicButton,
        UnderlineButton,
        UnorderedListButton,
        OrderedListButton,
        BlockquoteButton
    ]}
  />
);

export default DefaultBlockTypeSelect;

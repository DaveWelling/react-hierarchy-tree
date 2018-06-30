
import React from 'react';
import PropTypes from 'prop-types';

const SuggestionEntry = (props)=>{
    const {
      mention,
      theme,
      searchValue, // eslint-disable-line no-unused-vars
      isFocused, // eslint-disable-line no-unused-vars
      ...parentProps
    } = props;
    return (
      <div {...parentProps}>
        <div className={theme.mentionSuggestionsEntryContainer}>
          { mention.get('type') ? `${mention.get('type')}:${mention.get('name')}`: mention.get('name') }
        </div>
      </div>
    );
  };

  SuggestionEntry.propTypes = {
    mention: PropTypes.object.isRequired,
    theme: PropTypes.object,
    searchValue: PropTypes.string,
    isFocused: PropTypes.bool
  };

  export default SuggestionEntry;
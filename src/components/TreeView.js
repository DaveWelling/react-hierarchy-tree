import React from 'react';
import TreeNode from './TreeNode';
import { connect } from 'react-redux';
import {childrenForParentId} from '../orm/selector/modelSelectors';
import './treeView.css';
import {get} from 'lodash';

export class TreeView extends React.Component {
    render() {
        let {childrenData} = this.props;
        return (<div className="TreeView">
            {childrenData.map((d, index) => {
                // Saves a nasty lookup later
                let nextSequence = childrenData[index + 1] ? childrenData[index + 1].sequence : undefined;
                return (<TreeNode
                    key={d._id}
                    name={d.title}
                    label={d.title}
                    value={d.title}
                    data={d}
                    nextSequence={nextSequence}
                />);
            })}
        </div>);
    }
}

function mapStateToProps(state, ownProps) {
    // Get root nodes and sort by sequence property

    const rootModelId = get(state, 'app_model.rootModelId')
    let childrenData = childrenForParentId(state, rootModelId)
        .sort((a,b)=> a.sequence-b.sequence);
    return {
        childrenData
    };
}

export default connect(mapStateToProps)(TreeView);
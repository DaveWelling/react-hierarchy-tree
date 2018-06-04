import React from 'react';
import TreeNode from './TreeNode';
import { connect } from 'react-redux';

export class TreeView extends React.Component {
    render() {
        let {childrenData} = this.props;
        return (<div className="TreeView">
            {childrenData.map((d, index) => {
                return (<TreeNode
                    key={d.id}
                    name={d.title}
                    label={d.title}
                    value={d.value}
                    data={d}
                    previousSiblingData={index > 0 ? childrenData[index-1] : undefined}
                />);
            })}
        </div>);
    }
}

function mapStateToProps(state, ownProps) {

    const childrenData = state.TREE.nodes
        .filter(node=>!node.parentId)
        .sort((a,b)=> a.sequence-b.sequence);
    return {
        childrenData
    };
}

export default connect(mapStateToProps)(TreeView);
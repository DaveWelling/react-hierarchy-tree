import React from 'react';
import {object, string, func, bool} from 'prop-types';
import TreeText from './TreeText';
import cuid from 'cuid';
import { connect } from 'react-redux';

import './TreeNode.css';

class TreeNode extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            collapsed: true
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.makeChildOfPreviousSibling = this.makeChildOfPreviousSibling.bind(this);
        this.tryChildCollapse = this.tryChildCollapse.bind(this);
        this.tryCollapse = this.tryCollapse.bind(this);
        this.tryExpand = this.tryExpand.bind(this);
        this.tryChildExpand = this.tryChildExpand.bind(this);
        this.nodeClicked = this.nodeClicked.bind(this);
        this.addChild = this.addChild.bind(this);
        this.childrenTryCollapses = [];
        this.childrenTryExpands = [];

    }

    nodeClicked(e, node) {
        if (this.props.onClick) {
            this.props.onClick(node);
        }
        this.setState({ collapsed: !this.state.collapsed });
    }
    handleClick() {
        this.setState({ collapsed: !this.state.collapsed });
    }

    // React Synth event: https://developer.mozilla.org/en-US/docs/Web/Events/wheel
    handleWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            this.tryCollapse();
        } else if(e.deltaY > 0){
            this.tryExpand();
        }
    }

    tryExpand() {
        // To expand, must be collapsed and have something (other than _meta) inside
        if (this.state.collapsed && Object.keys(this.props.childrenData).length > 1) {
            this.setState({collapsed: false});
            return true;
        } else {
            return !!this.tryChildExpand();
        }
    }
    tryCollapse() {
        if (this.state.collapsed) {
            return false;
        } else {
            if (!this.tryChildCollapse()) {
                this.setState({collapsed: true});
            }
            return true;
        }
    }

    tryChildExpand() {
        for(let i = 0; i < this.childrenTryExpands.length; i++) {
            if (this.childrenTryExpands[i]()) {
                return true;
            }
        }
        return false;

    }
    tryChildCollapse() {
        for(let i = this.childrenTryCollapses.length-1; i >= 0; i--) {
            if (this.childrenTryCollapses[i]()) {
                return true;
            }
        }
        return false;
    }
    addChild(previousChild, siblingValue) {
        const {dispatch} = this.props;
        // increment sequence by half of the last digit of the previous child's sequence
        const nextSequence = previousChild.sequence % 1 === 0 ?
            previousChild.sequence + .5 :
            previousChild.sequence + (previousChild.sequence % 1 / 2);
        const newId = cuid();
        dispatch({
            type: 'ADD_TREE_NODE',
            add: {
                node : {
                    id: newId,
                    title: siblingValue,
                    value: siblingValue,
                    parentId: previousChild.parentId,
                    sequence: nextSequence
                }
            }
        });
        dispatch({
            type: 'TRANSFER_TREE_CHILDREN',
            transfer: {
                currentParentId: previousChild.id,
                newParentId: newId
            }
        });
    }
    makeChildOfPreviousSibling() {
        const {data, previousSiblingData, dispatch} = this.props;
        if (!previousSiblingData) return; // first sibling cannot be indented further
        dispatch({
            type: 'UPDATE_TREE_NODE',
            update: {
                id: data.id,
                changes: {
                    parentId: previousSiblingData.id
                }
            }
        });
    }

    render() {
        let that = this;
        const {nodeClicked, addChild, makeChildOfPreviousSibling} = this;
        that.childrenTryCollapses = [];  //remove previous tryCollapse pointers
        that.childrenTryExpands = [];
        let {label, useIcons, onClick, addSibling, childrenData, data, value, previousSiblingData} = this.props;
        const {collapsed} = this.state;

        let arrowClassName = 'tree-view_arrow';
        let containerClassName = 'tree-view_children';
        if (collapsed) {
            arrowClassName += ' tree-view_arrow-collapsed';
            containerClassName += ' tree-view_children-collapsed';
        }

        const Arrow = (
            <div
                className={arrowClassName}
                onClick={this.handleClick}
            />
        );
        let iconClass = getIconClass(data);
        const getChildCollapseFunctions = function(child){
            if (child === null) return; // ignore detach of ref
            that.childrenTryCollapses.push(child.tryCollapse);
            that.childrenTryExpands.push(child.tryExpand);
        };
        return (
                <div id={data.id} className={'tree-view-item'} onWheel={this.handleWheel}>
                    {childrenData && !!childrenData.length && Arrow}
                    {(!childrenData || !childrenData.length) &&
                        <span className="tree-view_spacer"/>
                    }
                    {useIcons && <span className={'tree-node-icon ' + iconClass} />}
                    <span title={label} className={'tree-view-text'}>
                        <TreeText value={value}
                            addSibling={function(siblingValue){addChild(data, siblingValue);}}
                            makeChildOfPreviousSibling={makeChildOfPreviousSibling}
                        />
                    </span>
                    <div className={containerClassName}>
                        {!collapsed && childrenData && childrenData.map((child, index) => {
                                return (
                                    <TreeNodeConnected key={child.id || child}
                                                name={child.title}
                                                label={child.prettyName || child.title}
                                                value={child.value}
                                                data={child}
                                                ref={getChildCollapseFunctions}
                                                useIcons={useIcons}
                                                onClick={onClick}
                                                previousSiblingData={index > 0 ? childrenData[index-1] : undefined}
                                    />
                                );
                            })
                        }
                    </div>
            </div>
        );
    }
}

TreeNode.propTypes = {
    data: object,
    name: string,
    label: string,
    onClick: func,
    useIcons: bool
};

function mapStateToProps(state, ownProps) {
    // Get children of this node and sort by sequence property
    const childrenData = state.TREE.nodes
        .filter(node=>node.parentId === ownProps.data.id)
        .sort((a,b)=> a.sequence-b.sequence);
    return {
        childrenData
    };
}
const TreeNodeConnected = connect(mapStateToProps)(TreeNode);
export default TreeNodeConnected;

function getIconClass() {
    return 'list-icon';
}
import React from 'react';
import { object, string, func, bool } from 'prop-types';
import TreeText from './TreeText';
import cuid from 'cuid';
import { connect } from 'react-redux';
import { childrenForParentId } from './orm/selector/EventSelectors';
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
        this.onValueChange = this.onValueChange.bind(this);
        this.select = this.select.bind(this);
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
        } else if (e.deltaY > 0) {
            this.tryExpand();
        }
    }

    tryExpand() {
        // To expand, must be collapsed and have something (other than _meta) inside
        if (this.state.collapsed && Object.keys(this.props.childrenData).length > 1) {
            this.setState({ collapsed: false });
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
                this.setState({ collapsed: true });
            }
            return true;
        }
    }

    tryChildExpand() {
        for (let i = 0; i < this.childrenTryExpands.length; i++) {
            if (this.childrenTryExpands[i] && this.childrenTryExpands[i]()) {
                return true;
            }
        }
        return false;
    }
    tryChildCollapse() {
        for (let i = this.childrenTryCollapses.length - 1; i >= 0; i--) {
            if (this.childrenTryCollapses[i] && this.childrenTryCollapses[i]()) {
                return true;
            }
        }
        return false;
    }
    select(){
        this.tryExpand();

    }
    addChild(previousChild, siblingValue, nextSequence, focusOnChild) {
        const { dispatch } = this.props;
        // increment sequence by half of the last digit of the previous child's sequence
        const newSequence = nextSequence
            ? previousChild.sequence + (nextSequence - previousChild.sequence) / 2
            : previousChild.sequence + 1;
        const newId = cuid();
        dispatch({
            type: 'CREATE_NOVEL_EVENT',
            create: {
                newEvent: {
                    _id: newId,
                    title: siblingValue,
                    value: siblingValue,
                    parentId: previousChild.parentId,
                    sequence: newSequence
                }
            }
        });
        dispatch({
            type: 'TRANSFER_NOVEL_EVENT',
            transfer: {
                currentParentId: previousChild._id,
                newParentId: newId
            }
        });
        if (focusOnChild) {
            dispatch({
                type: 'FOCUS_NOVEL_EVENT',
                focus: {_id: newId}
            });
        }
    }
    makeChildOfPreviousSibling() {
        const { data, previousSiblingData, dispatch } = this.props;
        if (!previousSiblingData) return; // first sibling cannot be indented further
        dispatch({
            type: 'UPDATE_NOVEL_EVENT',
            update: {
                _id: data._id,
                changes: {
                    parentId: previousSiblingData._id
                }
            }
        });
    }
    onValueChange(newValue) {
        const {
            dispatch,
            data: { _id }
        } = this.props;
        dispatch({
            type: 'UPDATE_NOVEL_EVENT',
            update: {
                _id,
                changes: {
                    title: newValue
                }
            }
        });
    }
    render() {
        let that = this;
        const { nodeClicked, addChild, makeChildOfPreviousSibling, onValueChange } = this;
        that.childrenTryCollapses = []; //remove previous tryCollapse pointers
        that.childrenTryExpands = [];
        let {
            nextSequence,
            label,
            useIcons,
            onClick,
            addSibling,
            childrenData,
            data,
            value,
            previousSiblingData
        } = this.props;
        const { collapsed } = this.state;

        let arrowClassName = 'tree-view_arrow';
        let containerClassName = 'tree-view_children';
        if (collapsed) {
            arrowClassName += ' tree-view_arrow-collapsed';
            containerClassName += ' tree-view_children-collapsed';
        }

        const Arrow = <div className={arrowClassName} onClick={this.handleClick} />;
        let iconClass = getIconClass(data);
        const getChildCollapseFunctions = function(connectedChild) {
            if (connectedChild === null) return; // ignore detach of ref
            const child = connectedChild.getWrappedInstance();
            that.childrenTryCollapses.push(child.tryCollapse);
            that.childrenTryExpands.push(child.tryExpand);
        };
        return (
            <div id={'tvi'+data._id} className={'tree-view-item'} onWheel={this.handleWheel}>
                {childrenData && !!childrenData.length && Arrow}
                {(!childrenData || !childrenData.length) && <span className="tree-view_spacer" />}
                {useIcons && <span className={'tree-node-icon ' + iconClass} />}
                <span title={label} className={'tree-view-text'}>
                    <TreeText
                        id={'text'+data._id}
                        value={value}
                        addSibling={function(siblingValue, focusOnNewSibling) {
                            addChild(data, siblingValue, nextSequence, focusOnNewSibling);
                        }}
                        makeChildOfPreviousSibling={makeChildOfPreviousSibling}
                        onValueChange={onValueChange}
                    />
                </span>
                <div className={containerClassName}>
                    {!collapsed &&
                        childrenData &&
                        childrenData.map((child, index) => {
                            let nextSequence = childrenData[index + 1] ? childrenData[index + 1].sequence : undefined;
                            return (
                                <TreeNodeConnected
                                    key={child._id || child}
                                    name={child.title}
                                    label={child.prettyName || child.title}
                                    value={child.title}
                                    data={child}
                                    ref={getChildCollapseFunctions}
                                    useIcons={useIcons}
                                    onClick={onClick}
                                    previousSiblingData={index > 0 ? childrenData[index - 1] : undefined}
                                    nextSequence={nextSequence}
                                />
                            );
                        })}
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
    const childrenData = childrenForParentId(state, ownProps.data._id).sort((a, b) => a.sequence - b.sequence);
    return {
        childrenData
    };
}
const TreeNodeConnected = connect(mapStateToProps, null, null, {withRef:true})(TreeNode);
export default TreeNodeConnected;

function getIconClass() {
    return 'list-icon';
}

import React from 'react';
import TreeNode from './TreeNode';
import './treeView.css';
import { getChildren } from '../actions/modelActions';
import config from '../config';
import database from '../database';
import TreeViewContext from './TreeViewContext';
import ProjectContext from '../projectContext';
import { subscribe } from '../eventSink';

const defaultRoot = {
    title: '',
    _id: 'root'
};

export default class TreeView extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.modelChanged = this.modelChanged.bind(this);
        this.loadRoot = this.loadRoot.bind(this);

        this.unsubscribes = [];
        this._private = {};


        this.unsubscribes.push(subscribe('import_complete', this.loadRoot));
        this.unsubscribes.push(subscribe('purge_complete', this.loadRoot));

        // Allow for dynamic TreeViewContext updates
        this.setActiveTreeTextId = (activeTreeTextId)=> {
            this.setState({
                activeTreeTextId
            });
        };

        this.state = {
            root: defaultRoot,
            childrenModels: [],
            setActiveTreeTextId: this.setActiveTreeTextId,
            activeTreeTextId: ''
        };
        this.loadRoot();
    }

    componentWillUnmount() {
        this.unsubscribes.forEach(unsubscribe=>unsubscribe());
    }

    loadRoot() {
        database.getRepository(config.defaultCollectionName).then(repository=>{
            this._private.repository = repository;
            repository.get('root').then(root=>{
                if (root) {
                    this.modelChanged(root);
                } else {
                    repository.create(defaultRoot);
                }
            });


            this.updateChildren('root');

            this.unsubscribes.push(repository.onChange('root', this.modelChanged));
            this.unsubscribes.push(repository.onParentChange('root', ()=>this.updateChildren('root')));
        });
    }

    updateChildren(modelId) {
        getChildren(modelId).then(childrenModels => {
            this.setState({
                childrenModels
            });
            if (childrenModels.length === 0) {
                const firstModel = { title: '', parentId: 'root', type: 'summary' };
                this._private.repository.create(firstModel);
            }
        });
    }

    modelChanged(root) {
        this.setState({
            root
        });
        this.context.setProjectName(root.title);
    }

    onChange(e) {
        const title = e.currentTarget.value;
        this._private.repository.update('root', 'title', title);
    }


    render() {
        let {childrenModels, root} = this.state;
        return (<TreeViewContext.Provider value={this.state}>
            <div className="TreeView">
                <input
                    id="projectName"
                    className="projectName"
                    placeholder="Put a project name here"
                    type="text"
                    value={root.title}
                    onChange={this.onChange}
                />
                {childrenModels.map((model, index) => {
                    // Saves a nasty lookup later
                    let nextSequence = childrenModels[index + 1] ? childrenModels[index + 1].sequence : undefined;
                    return (
                        <TreeNode
                            key={model._id}
                            name={model.title}
                            label={model.title}
                            value={model.title}
                            model={model}
                            nextSequence={nextSequence}
                        />
                    );
                })}
                <div className="node-instructions">Type Enter key&#x23ce; for a new line or Tab key&#x21b9; to indent.</div>
            </div>
        </TreeViewContext.Provider>);
    }
}

TreeView.contextType = ProjectContext;

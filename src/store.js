import { createStore } from 'redux'
import {combineReducers} from 'redux';
import cuid from 'cuid';



const TREE = function treeReducer(state= getData(3,3), action){
    switch (action.type) {
        case 'ADD_TREE_NODE': {
            const newState = {...state};
            // convert sequence back to integers so next insertion sequence is not the same value.
            newState.nodes = [...state.nodes, action.add.node];
            newState.nodes = newState.nodes.sort((a,b)=>a.sequence-b.sequence);
            newState.nodes.forEach((n, i)=>n.sequence = i);
            return newState;
        }
        case 'TRANSFER_TREE_CHILDREN': {
            const newState = {...state};
            newState.nodes = state.nodes.map(n=>{
                if (n.parent === action.transfer.currentParentId){
                    return {
                        ...n,
                        parent: action.transfer.newParentId
                    };
                }
                return n;
            })
            return newState;
        }
        case 'UPDATE_TREE_NODE': {
            const newState = {...state};
            newState.nodes = state.nodes.map(n=>{
                if (n.id === action.update.id){
                    return {
                        ...n,
                        ...action.update.changes
                    };
                }
                return n;
            })
            return newState;
        }
        default:
            return state;
    }
}


function getData(depth, depthCount, parent, all=[]) {
    if (depth <= 0) return all;
    for (let index = 0; index < depthCount; index++) {
        const newNode = {
            id: cuid(),
            value: 'depth ' + depth + ' | index ' + index,
            title: 'depth ' + depth + ' | index ' + index,
            parent: parent ? parent.id : undefined,
            sequence: index
          };
        all.push(newNode);
        getData(depth-1, depthCount, newNode, all);
    }
    return all;
  }


export default function getStore(){
    return createStore(
        combineReducers({
            TREE
        })
    );
}
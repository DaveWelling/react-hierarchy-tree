// Don't use this unless you need to know an action happened
// but you don't want to store something in state as a result.
// Usually you just want to use a reducer and update state.

// Also, be aware that this is at the end of the middleware pipeline.
// Regular actions are processed first.
// To intercept before actions, subscribe with the third parameter = true.

let sink = {};
const eventSink = () => next => action => {
    publish(action);
    return next(action);
};
const preActionEventSink = () => next => action => {
    publish(action, true);
    return next(action);
};

module.exports = {
    subscribe,
    unsubscribe,
    publish,
    eventSink,
    preActionEventSink,
    clearSink
};

function unsubscribe(action, listener, preAction) {
    let index = action;
    if (preAction) {
        index = 'PRE_' + action;

    }
    let subscription = sink[index] || [];
    if (subscription.length < 2) {
        delete sink[index];
    } else {
        subscription.splice(subscription.indexOf(listener),1);
    }
}

function subscribe(action, listener, preAction = false){
    let index = action;
    if (preAction) {
        index = 'PRE_' + action;

    }
    sink[index] = sink[index] || [];
    sink[index].push(listener);
    // return unsubscribe method;
    return ()=>sink[index].splice(sink[index].indexOf(listener), 1);
}

function publish(action, preAction = false){
    if (preAction && sink.hasOwnProperty('PRE_'+action.type)) {
        const [actionName, ,] = action.type.toLowerCase().split('_');
        sink['PRE_'+action.type].forEach(listener => listener(action[actionName]));
    } else if (sink.hasOwnProperty(action.type)) {
        const [actionName, ,] = action.type.toLowerCase().split('_');
        sink[action.type].forEach(listener => listener(action[actionName]));
    }
}

function clearSink(){
    sink = {};
}

import cuid from 'cuid';

export default function bootstrap(orm, rootModelId, loadDemoState=false) {
    // Get the empty state according to our schema.
    const initialState = orm.getEmptyState();

    // Begin a mutating session with that state.
    // `initialState` will be mutated.
    const mutableSession = orm.mutableSession(initialState);

    // Model classes are available as properties of the
    // Session instance.
    const { Model } = mutableSession;

    Model.create({
        _id: rootModelId,
        title: 'Root Model - this should not display',
        sequence: 0
    });
    Model.create({
        _id: cuid(),
        title: '',
        sequence: 0,
        parent: rootModelId,
        ui: {
            selectionStart: 0,
            selectionEnd: 0
        }
    });

    if (loadDemoState) getDemoData(3, 3);

    function getDemoData(depth, depthCount, parent) {
        if (depth <= 0) return;
        for (let index = 0; index < depthCount; index++) {
            const _id = cuid();
            const newNode = {
                _id,
                title: 'depth ' + depth + ' | index ' + index + ' | ' + _id,
                parent: parent ? parent._id : config.rootModelId,
                sequence: index
            };
            Model.create(newNode);
            getDemoData(depth - 1, depthCount, newNode);
        }
    }

    return {
        orm: initialState
    };
}

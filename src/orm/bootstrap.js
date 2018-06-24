import cuid from 'cuid';
export default function bootstrap(orm) {
    // Get the empty state according to our schema.
    const initialState = orm.getEmptyState();

    // Begin a mutating session with that state.
    // `initialState` will be mutated.
    const mutableSession = orm.mutableSession(initialState);

    // Model classes are available as properties of the
    // Session instance.
    const { Model } = mutableSession;

    getData(3, 3);

    function getData(depth, depthCount, parent) {
        if (depth <= 0) return;
        for (let index = 0; index < depthCount; index++) {
            const _id = cuid();
            const newNode = {
                _id,
                title: 'depth ' + depth + ' | index ' + index + ' | ' + _id,
                parent: parent ? parent._id : undefined,
                sequence: index
            };
            Model.create(newNode);
            getData(depth - 1, depthCount, newNode);
        }
    }

    return {
        orm: initialState
    };
}

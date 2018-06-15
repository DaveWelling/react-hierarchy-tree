import cuid from 'cuid';
export default function bootstrap(orm) {
    // Get the empty state according to our schema.
    const initialState = orm.getEmptyState();

    // Begin a mutating session with that state.
    // `initialState` will be mutated.
    const mutableSession = orm.mutableSession(initialState);

    // Model classes are available as properties of the
    // Session instance.
    const { Event } = mutableSession;

    getData(3, 3);

    function getData(depth, depthCount, parent) {
        if (depth <= 0) return;
        for (let index = 0; index < depthCount; index++) {
            const newNode = {
                _id: cuid(),
                title: 'depth ' + depth + ' | index ' + index,
                parentId: parent ? parent._id : undefined,
                sequence: index
              };
            Event.create(newNode);
            getData(depth-1, depthCount, newNode);
        }
      }

    // function getData(depth, depthCount, maxDepth) {
    //     const children = [];
    //     if (depth > maxDepth) return children;
    //     for (let index = 0; index <= depthCount; index++) {
    //         const newNode = {
    //             id: cuid(),
    //             value: 'depth ' + depth + ' | index ' + index,
    //             title: 'depth ' + depth + ' | index ' + index,
    //             children: getData(depth + 1, depthCount),
    //             sequence: index
    //         };
    //         Event.create(newNode);
    //         children.push(newNode);
    //     }
    //     return children;
    // }

    return {
        orm: initialState
    }
}

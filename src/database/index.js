const lokijs = require('lokijs');
require('core-js/stable');
require('regenerator-runtime/runtime');
const Repository = require('./repository');
const { publish } = require('../eventSink');
const logging = require('../logging');

const config = require('../config');

const defaultCollectionName = config.defaultCollectionName;
let adapter,
    env = 'NODEJS';
let idbAdapter;
// eslint-disable-next-line no-undef
if (__TESTING__) {
    adapter = new (require('lokijs').LokiMemoryAdapter)();
} else {
    env = 'BROWSER';
    idbAdapter = new (require('lokijs/src/loki-indexed-adapter'))('curatorAdapter');
    adapter = new lokijs.LokiPartitioningAdapter(idbAdapter, { paging: true });
}

let startPromise, _mainFileName;
const _create = async (mainFileName = 'curator', autosaveInterval = 10000) => {
    _mainFileName = mainFileName;
    const startPromise = new Promise((resolve, reject) => {
        try {
            let loki = new lokijs(_mainFileName, {
                env, // eslint-disable-next-line no-undef
                autosave: !__TESTING__, // This will make tests hang if it is turned on.
                autosaveInterval,
                adapter,
                autoload: true,
                autoloadCallback: () => resolve(loki)
            });
        } catch (err) {
            reject(err);
        }
    });
    return startPromise;
};

const get = () => {
    if (!startPromise) startPromise = _create();
    return startPromise;
};

module.exports = {
    getRepository,
    purgeDatabase,
    get,
    loadDatabase,
    serializeDatabase
};

let repositories = {};
function getCollection(collectionName = defaultCollectionName) {
    return get().then(loki => {
        let collection = loki.getCollection(collectionName);
        if (!collection) {
            collection = loki.addCollection(collectionName, { unique: ['_id'] });
        }
        return collection;
    });
}

function getRepository(collectionName) {
    if (!repositories[collectionName]) {
        repositories[collectionName] = getCollection(collectionName).then(collection => {
            return new Repository(collection);
        });
    }
    return repositories[collectionName];
}

async function purgeDatabase(fileName = 'curator') {
    return startPromise.then(loki => {
        repositories = {};
        // loki.listCollections().forEach(collection=>{
        //     loki.removeCollection(collection.name);
        // });
        return deleteDatabase(fileName)
            .then(() => {
                return new Promise((resolve, reject) => {
                    saveToIndexedDb(loki, fileName, err => {
                        if (err) reject(err);
                        resolve(loki);
                    });
                });
            })
            .then(() => {
                publish({
                    type: 'purge_complete',
                    import: {}
                });
            });
    });
}

async function deleteDatabase(mainFileName = 'curator') {
    return startPromise.then(loki => {
        repositories = {};
        return new Promise((resolve, reject) => {
            try {
                if (idbAdapter) {
                    idbAdapter.deleteDatabase(mainFileName);
                    idbAdapter.deleteDatabasePartitions(mainFileName);
                    resolve(loki);
                } else {
                    loki.deleteDatabase(err => {
                        if (err) reject(err);
                        resolve(loki);
                    });
                }
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function loadDatabase(databaseJson, mainFileName = 'curator') {
    return deleteDatabase(mainFileName).then(loki => {
        const newStartPromise = new Promise((resolve, reject) => {
            function finishSave(err) {
                if (err) {
                    logging.error('Error while loading database from import:', err);
                } else {
                    startPromise = newStartPromise;
                    publish({
                        type: 'import_complete',
                        import: {}
                    });
                    resolve(loki);
                }
            }
            try {
                loki.autoloadCallback = () => resolve(loki);
                loki.loadJSON(databaseJson);
                saveToIndexedDb(loki, mainFileName, finishSave);
            } catch (err) {
                reject(err);
            }
        });
        return newStartPromise;
    });
}

async function saveToIndexedDb(loki, fileName, callback) {
    loki.collections.forEach(collection => (collection.dirty = true));
    if (idbAdapter) {
        // Export, as in export to disk, i.e. indexedDb
        adapter.exportDatabase(fileName, loki, callback);
    } else {
        loki.saveDatabase(callback);
    }
}

async function serializeDatabase() {
    return startPromise.then(loki => {
        return loki.serialize();
    });
}

window.addEventListener('beforeunload', function (e) {
    logging.info('trying to save');
    startPromise.then(loki => {
        if (idbAdapter) {
            // Export, as in export to disk, i.e. indexedDb
            adapter.exportDatabase(_mainFileName, loki, ()=>logging.info('saved.'));
        } else {
            loki.saveDatabase(()=>logging.info('saved.'));
        }
    });
});

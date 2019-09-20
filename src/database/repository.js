module.exports = class Repository {
    constructor(collection) {
        this._privates = {};
        this._privates.collection = collection;
    }
    update(_id, propertyName, value) {
        const query = this._privates.collection
            .find()
            .where('_id')
            .eq(_id);
        return query.update({
            $set: {
                [propertyName]: value
            }
        });
    }
    create(data) {
        return this._privates.collection.insert(data);
    }
    get(_id) {
        return this._privates.collection
            .findOne()
            .where('_id')
            .eq(_id)
            .exec();
    }
    find(query) {
        return query(this._privates.collection.find()).exec();
    }
};

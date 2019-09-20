const cuid = require('cuid');
const getRepository = require('../../src/database').getRepository;
const expect = require('expect');

describe('database', function(){
    // after(function () {
    //     global.asyncDump();
    // });
    describe('update', function(){
        it('changes a value', async function(){
            let _id = cuid();
            const repo = await getRepository('test');
            await repo.create({_id, hi: 'there', parentId: 'a0', sequence: 0 });
            await repo.update(_id, 'hi', 'you');
            const result = await repo.get(_id);
            expect(result.hi).toEqual('you');
        });
    });
});
const db = require('../../data/dbConfig');

function getAll(){
    return db('users');
}

function getById(id){
    return db('users').where({ id }).first();
}

function getByUsername(username){
    return db('users').where({ username }).first();
}

async function insert(user){
    let [id] = await db('users').insert(user);
    return getById(id);
}

module.exports = {
    getAll,
    getById,
    getByUsername,
    insert
}


const Users = require('../users/users-model');

async function usernameFree(req, res, next) {
    const {username} = req.body;
     let user = await Users.getByUsername(username);
     if(!user){
        next();
     }else{
        next({status: 400, customMessage: 'username taken'});
     }
}

async function checkPayload(req, res, next) {
    const {username, password} = req.body;
    if(username && password && username.trim() && password.trim()){
        next();
    }else{
        next({status: 400, customMessage:'username and password required'});
    }
}

module.exports = {
    usernameFree,
    checkPayload
}
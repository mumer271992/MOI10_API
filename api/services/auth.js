var promise = require('promise');
var jwt = require('jsonwebtoken');

module.exports = {
    sign: (id)=> {
        return jwt.sign({user_id: id}, sails.config.auth.jwt_secret);
    },
    verify: (token) => {
        let user_id = null;
        try {
          let decoded = jwt.verify(token, sails.config.auth.jwt_secret);
          user_id = decoded.user_id;
        } catch(err) {
          console.log(err);
          user_id = null;
        }
        return user_id;
      }
}
/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {
  console.log("Checking Middleware");
  const auth_header = req.headers['authorization'];
  if(auth_header){
    const auth_header_parts = auth_header.split(' ');
    if(auth_header_parts.length == 2 && auth_header_parts[0] === 'Basic'){
      const user_id = auth.verify(auth_header_parts[1]);
      if(user_id){
        User.findOne({id: user_id}).then((user)=> {
          req.session.user = user;
          return next();
        });
      }else{
          // User is allowed, proceed to the next policy, 
        // or if this is the last policy, the controller
        if (req.session.authenticated) {
          return next();
        }

        // User is not allowed
        // (default res.forbidden() behavior can be overridden in `config/403.js`)
        return res.forbidden('You are not permitted to perform this action.');
      }
    }
    else {
      return res.status(401).send({error: "Authorizatoin token format is Authorization: Basic [token]"});
    }
  }
  else{
    return res.status(401).send({error: "Auth token is required in authorization header"});
  }
};

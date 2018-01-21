var facebookHelper = require('../helpers/facebook');
var bcrypt = require('bcrypt');

module.exports = {
    postSignup: (req, res) => {
        const user_data = req.body;
        User.findOne({
            $or: [{
				email: user_data.email
			}]
        }).then((user)=> {
            if(user){
                return res.status(403).send({error: "Email already exists"});
            }
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(user_data.password, salt, function(err, hash) {
                  if(err) {
                      console.log(err);
                      cb(err);
                  } else {
                    user_data.password = hash;
                        console.log(hash);
                        User.create(user_data).then((user)=> {
                            const jwt_token = auth.sign(user.id);
                            delete user.password;
                            return res.json({token: jwt_token, user: user});
                        }).catch((err)=> {
                            res.status(500).send({error: err});
                        });       
                  }
                });
            });
        });
    },
    postLogin: (req, res) => {
        const user_data = req.body;
        User.findOne({
            $or: [{
                email: user_data.email
            }]
        }).then((user) => {
            if(!user){
                return res.status(401).send({error: "User not found"});
            }
            // }else if(user.password !== user_data.password){
            //     return res.status(401).send({error: "Invalid credentials"});
            // }

            bcrypt.compare(user_data.password, user.password, function(err, hashResult){
                if(!hashResult){
                    return res.status(401).send({error: "Invalid credentials"});
                }
                const jwt_token = auth.sign(user.id);
                delete user.password;
                return res.json({token: jwt_token, user: user});
            });
        });
    },
    postFacebookLogin: (req, res) => {
        const body = req.body;
        //console.log(body.access_token);
        console.log(facebookHelper);
        facebookHelper.login(body.access_token).then((user_data)=> {
            console.log("User Data");
            console.log(user_data);
            if(user_data && user_data.email){
                User.findOne({
                    $or: [{
                        email: user_data.email
                    }]
                }).then((user)=> {
                    if(user){
                        const jwt_token = auth.sign(user.id);
                        return res.json({token: jwt_token, user: user});
                    }
        
                    User.create({"email": user_data.email, name: `${user_data.first_name} ${user_data.last_name}`}).then((user)=> {
                        const jwt_token = auth.sign(user.id);
                        return res.json({token: jwt_token, user: user});
                    }).catch((err)=> {
                        res.status(500).send({error: err});
                    });
                });
            }
            else {
                res.status(400).send("Email not found");
            }
        }).catch((err)=> {
            console.log(err);
        });
    }
}
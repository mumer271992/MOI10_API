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

            User.create(user_data).then((user)=> {
                const jwt_token = auth.sign(user.id);
                return res.json({token: jwt_token});
            }).catch((err)=> {
                res.status(500).send({error: err});
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
            if(!user || (user.password !== user_data.password)){
                return res.status(401).send({error: "Invalid credentials"});
            }

            const jwt_token = auth.sign(user.id);
            return res.json({token: jwt_token});
        });
    }
}
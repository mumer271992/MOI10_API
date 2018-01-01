module.exports = function(req, res, next){
    console.log("Map Owner Middleware");
    const user = req.session.user;
    req.body.user_id = user.id;
    return next();
}
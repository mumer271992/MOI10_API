var ObjectId = require('mongodb').ObjectID;

module.exports = function(req, res, next){
    if(req.body.item_id){
        console.log('Request Body');
        console.log(req.body);
        ListItem.findOne({ "id" : req.body.item_id}).exec(function(err, item){
            
            req.body.list_id = item.list_id;
            return next();
        });
    }
    else {
        return res.status(403).send({"error": "You must select vote on list item."})
    }
}
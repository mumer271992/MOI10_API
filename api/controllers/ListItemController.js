/**
 * ListItemController
 *
 * @description :: Server-side logic for managing listitems
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    vote: (req, res) => {
        const item_id = req.body.item_id;
        //console.log(req);
        //console.log(req.params.id);
        // res.send(200);
        ListItem.findOne({
                id: req.body.item_id
            }).then((item) => {
            //console.log("Item found 1");
            //console.log(item);
            if(item && item.id){
                //console.log("Item found 2");
                if(!item.votes){
                    item.votes = 0;
                }
                item.votes = parseInt(item.votes) + parseInt(req.body.vote);
                Useritems.findOne({
                    "user_id": req.body.user_id,
                    "item_id": req.body.item_id
                }).then((user_item)=> {
                    if(!user_item){
                        Useritems.create({
                            "user_id": req.body.user_id,
                            "item_id": req.body.item_id,
                            "vote": req.body.vote
                        }).then((useritem) => {
                            if(useritem && useritem.id){
                                item.save();
                                res.status(200).send({"success": true});
                            }
                            else {
                                res.status(500).send({"error" : "Action cannot be completed"});
                            }
                        }).catch((error) => {
                            console.log("Error during user item mapping");
                            console.log(error);
                            res.status(500).send({"error" : "Action cannot be completed"});
                        });
                    }
                    else{
                        console.log("Item already voted");
                        //res.status(403).send({"error": "Already have voted this item"});

                        if(parseInt(user_item.vote) !== (parseInt(req.body.vote))){
                            console.log("Going to update vote");
                            if(parseInt(user_item.vote) > parseInt(req.body.vote)){
                                item.votes = parseInt(item.votes) - 1;
                                console.log("user_item.vote > req.body.vote: -2", item.votes);
                            }
                            else if(parseInt(user_item.vote) < parseInt(req.body.vote)){
                                item.votes = parseInt(item.votes) + 1;
                                console.log("user_item.vote < req.body.vote: +2", item.votes);
                            }
                            user_item.vote = req.body.vote;
                            item.save();
                            user_item.save();
                            res.status(200).send({"success": true});
                        }
                        else{
                            console.log("Going to delete vote");
                            if(parseInt(user_item.vote) > 0){
                                item.votes = parseInt(item.votes) - 2;
                                console.log("user_item.vote > 0: -1", item.votes);
                            }
                            else if(parseInt(user_item.vote) < 0){
                                item.votes = parseInt(item.votes) + 2;
                                console.log("user_item.vote < 0: +1", item.votes);
                            }
                            item.save();
                            user_item.destroy();
                            res.status(200).send({
                                success: true
                            });
                            // user_item.destroy().exec((err) => {
                            //     if(err){
                            //         return res.status(500).send({
                            //             error: "Item is not deleted"
                            //         });
                            //     }
                            //     sails.log('The records for troublesome users (3 and 97) have been deleted, if they still existed.');
                            //     res.status(200).send({
                            //         success: true
                            //     });
                            // });
                        }
                    }
                }).catch((error)=> {
                    console.log("Error", error);
                });            
            }
            else{
                res.status(404).send({"error": "No item found"});
            }
        }).catch((err) => {
            console.log("Error: " , err);
            res.status(500);
        });
    }
};


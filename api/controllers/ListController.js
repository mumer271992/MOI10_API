/**
 * ListController
 *
 * @description :: Server-side logic for managing lists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	fetch: function(req, res){
        // var data;
        
        var user_id = req.query.user_id;
        //console.log(user_id);
        List.findOne({
            id: req.params.id
        }).populate('items').exec((err, list)=> {
            console.log("List Items length: ", list.items.length);
            if(!list.items.length){
                res.status(200).json(list);
            }
            var counter = 0;
            var new_list = {};
            var items = [];
            //items = list.items;
            for( let i = 0; i < list.items.length; i++){
                // ListItem.findOne({id: items[i].id}).populate('voters').exec((err, populatedItem)=> {
                //     items[i] = populatedItem;
                //     counter++;
                    
                //     if(counter === items.length){
                //         new_list = { ...list };
                //         new_list.items = items;
                //         res.status(200).json(new_list);
                //     }
                // });
                console.log("Item number ", i);
                ListItem.findOne({id: list.items[i].id}).then((item)=> {
                                        
                    var searchParams = {
                        item_id: item.id,
                        user_id: user_id
                    };

                    console.log("Search Params");
                    console.log(searchParams);
                    Useritems.findOne(searchParams).then((data) => {
                        if(data){
                            item.my_vote = data;
                            console.log("Vote found");
                        }
                        items.push(item);
                        counter++;
                        if(counter === list.items.length){
                           new_list = { ...list };
                           new_list.items = items;
                           console.log("Going to send response");
                           res.status(200).json(new_list);
                        }
                    });
                })
            }
        });
        
    }
};


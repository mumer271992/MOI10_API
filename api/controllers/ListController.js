/**
 * ListController
 *
 * @description :: Server-side logic for managing lists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	fetch: function(req, res){
        var data;
        List.findOne({
            id: req.params.id
        }).populate('items').exec((err, list)=> {
            console.log(list);
            res.json(list);
        });
        
    }
};


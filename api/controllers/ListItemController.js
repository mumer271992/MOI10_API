/**
 * ListItemController
 *
 * @description :: Server-side logic for managing listitems
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var keywordsCalculator = require('../helpers/keywordsCalculator');
var dictionaryHelper = require('../helpers/dictionaryHelpers');

module.exports = {
    create: function(req, res){
        var body = req.body;
        ListItem.create(body).then(function(new_item){
            keywordsCalculator.maintainKeywordsListFromListItem(new_item.id, function(wordsMap){
                List.findOne({
                    id: new_item.list_id
                }).then(function(list){
                    var existingWordsMap = list.words_list;
                    var keysOfExistingMap = Object.keys(existingWordsMap);
                    var keysOfWordsMap = Object.keys(wordsMap);
                    for(let i = 0; i < keysOfWordsMap.length; i++){
                        if(!existingWordsMap.hasOwnProperty(keysOfWordsMap[i])){
                            existingWordsMap[keysOfWordsMap[i]] = wordsMap[keysOfWordsMap[i]];                            
                        }
                        else{
                            existingWordsMap[keysOfWordsMap[i]].count += wordsMap[keysOfWordsMap[i]].count; 
                        }
                    }
                    existingWordsMap = dictionaryHelper.calculateRankofWords(existingWordsMap);
                    existingWordsMap = dictionaryHelper.calculateScoresOfWords(existingWordsMap);
                    dictionaryHelper.convertWordsMapToDictionary(wordsMap);
                    list.words_list = existingWordsMap;
                    list.save();
                    res.status(200).json(new_item);
                }).catch(function(err){
                    console.log(err);
                    res.status(500).send("Some internal error occured.");
                });
            });
        }).catch(function(err){
            res.status(500).send({error: err});
        });
    },
    vote: (req, res) => {
        const item_id = req.body.item_id;
        ListItem.findOne({
                id: req.body.item_id
            }).then((item) => {
            if(item && item.id){
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
                            "list_id": req.body.list_id,
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
                        if(parseInt(user_item.vote) !== (parseInt(req.body.vote))){
                            if(parseInt(user_item.vote) > parseInt(req.body.vote)){
                                item.votes = parseInt(item.votes) - 1;
                            }
                            else if(parseInt(user_item.vote) < parseInt(req.body.vote)){
                                item.votes = parseInt(item.votes) + 1;
                            }
                            user_item.vote = req.body.vote;
                            item.save();
                            user_item.save();
                            res.status(200).send({"success": true});
                        }
                        else{
                            if(parseInt(user_item.vote) > 0){
                                item.votes = parseInt(item.votes) - 2;
                            }
                            else if(parseInt(user_item.vote) < 0){
                                item.votes = parseInt(item.votes) + 2;
                            }
                            item.save();
                            user_item.destroy();
                            res.status(200).send({
                                success: true
                            });
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


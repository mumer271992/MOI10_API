/**
 * ListController
 *
 * @description :: Server-side logic for managing lists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var keywordsCalculator = require('../helpers/keywordsCalculator');
var dictionaryHelpers = require('../helpers/dictionaryHelpers');
var waterfall = require('async-waterfall');

module.exports = {
    create: function(req, res){
        var body = req.body;
        List.create(body).then(function(new_list){
            console.log("List is created.");
            keywordsCalculator.maintainKeywordsListFromList(new_list.id, function(wordsMap){
                console.log("Keywords List is maintained.");
                new_list.words_list = wordsMap;
                new_list.save();
                dictionaryHelpers.convertWordsMapToDictionary(wordsMap);
                res.status(200).json(new_list);
            });
        }).catch(function(err){
            res.status(500).send({error: err});
        });
    },
	fetch: function(req, res){
        // var data;
        
        var user_id = req.query.user_id;
        //console.log(user_id);
        List.findOne({
            id: req.params.id
        }).populate('items').exec((err, list)=> {
            console.log("List Items length: ", list.items.length);
            if(!list.items.length){
                //res.status(200).json(list);
            }
            var counter = 0;
            var new_list = {};
            var items = [];
            //items = list.items;
            waterfall([function(cb){
                if(!list.items.length){
                    cb();
                }
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
                               //res.status(200).json(new_list);
                               cb();
                            }
                        });
                    })
                }
            },
            function(cb){
                Dictionary.find().then(function(dictionary){
                    console.log("Dictionary fetched");
                    let words_map = { ...list.words_list };
                    let keys = Object.keys(words_map);
                    for(let j = 0; j < keys.length; j++){
                        let found = dictionary.find((item) => {
                            return item.word === keys[j];
                        });
                        if(found){
                            console.log("Found match in dictionary");
                            words_map[keys[j]].word_score = found.score * words_map[keys[j]].score;
                        }
                        else{
                            words_map[keys[j]].word_score = 1;
                        }
                    }
                    list.words_list = words_map;
                    //res.status(200).json(list);
                    cb();
                }).catch(function(err){
                    console.log("Error", err);
                });
            }],
            function(){
                console.log("final results");
                console.log(list)
                res.status(200).json(list);
            });
            
            
        });
        
    }
};


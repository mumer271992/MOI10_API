/**
 * ListController
 *
 * @description :: Server-side logic for managing lists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var keywordsCalculator = require('../helpers/keywordsCalculator');
var dictionaryHelpers = require('../helpers/dictionaryHelpers');
var slugHelper = require('../helpers/slugHelper');
var waterfall = require('async-waterfall');

module.exports = {
    create: function(req, res){
        var body = req.body;
        slugHelper.makeSlug(body.name).then(function(slug){
            body.slug = slug;
            List.create(body).then(function(new_list){  
                keywordsCalculator.maintainKeywordsListFromList(new_list.id, function(wordsMap){
                    new_list.words_list = wordsMap;
                    new_list.save();
                    dictionaryHelpers.convertWordsMapToDictionary(wordsMap);
                    res.status(200).json(new_list);
                });
            }).catch(function(err){
                res.status(500).send({error: err});
            });
        }).catch(function(err){
            console.log(err)
        });
    },
	fetch: function(req, res){
        // var data;
        
        var user_id = req.query.user_id;
        //console.log(user_id);
        List.findOne({
            slug: req.params.slug
        }).populate('items').exec((err, list)=> {
            if(!list.items.length){
                //res.status(200).json(list);
            }
            var counter = 0;
            var new_list = {};
            var items = [];
            waterfall([function(cb){
                if(!list.items.length){
                    cb();
                }
                for( let i = 0; i < list.items.length; i++){
                    ListItem.findOne({id: list.items[i].id}).then((item)=> {
                                            
                        var searchParams = {
                            item_id: item.id,
                            user_id: user_id
                        };
                        Useritems.findOne(searchParams).then((data) => {
                            if(data){
                                console.log('hthththt');
                                item.my_vote = data;
                            }
                            items.push(item);
                            counter++;
                            if(counter === list.items.length){
                                console.log('pass');
                               new_list = { ...list };
                               new_list.items = items;
                               list = new_list;
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
                            words_map[keys[j]].word_score = found.score * words_map[keys[j]].score;
                        }
                        else{
                            words_map[keys[j]].word_score = 1;
                        }
                    }
                    list.words_list = words_map;
                    cb();
                }).catch(function(err){
                    console.log("Error", err);
                });
            },
            function(cb){
                List.find().then(function(lists){
                    var releventLists = keywordsCalculator.findReleventLists(list, lists);
                    list.relevent_lists = releventLists;
                    cb();
                }).catch(function(err){
                    console.log(err);
                });
            }
            ],
            function(){
                console.log("final results");
                res.status(200).json(list);
            });
            
            
        });
        
    }
};


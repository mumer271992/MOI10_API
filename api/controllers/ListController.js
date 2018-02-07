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
var ObjectId = require('mongodb').ObjectID;
var jwt = require('jsonwebtoken');

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
            if(!list || !list.items || !list.items.length){
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
            },
            function(cb){
                Useritems.native(function(err, useritems){
                    useritems.aggregate([
                        {
                            $group : {
                                _id : "$list_id",
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $sort: {
                                "count": -1
                            }
                        },
                        { 
                            "$limit": 10 
                        }
                    ], function(err, result){
                        if (err) return res.serverError(err);
                        let lists_array = [];
                        for(let k=0; k < result.length;k++){
                            if(result[k]._id){
                                lists_array.push(new ObjectId(result[k]._id));
                            }
                        }
                        List.find({
                            "_id": {
                                "$in": lists_array
                            }
                        }).then(function(lsts){
                            let order_lists = [];
                            for(let ll = 0; ll < lists_array.length; ll++){
                                order_lists.push(lsts.find((item) => item.id == lists_array[ll]));
                            }
                            list.popular = order_lists;
                            cb();
                        }).catch(function(error){
                            console.log('Error');
                            console.log(error);
                        });
                    });
                });
            },function(cb){
                Useritems.native(function(err, useritems){
                    useritems.aggregate([
                        {
                            $group : {
                                _id : "$user_id",
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $lookup: {
                                from: "user",
                                localField: "_id",
                                foreignField: "_id",
                                as: "user"
                            }
                        },
                        {
                            $sort: {
                                "count": -1
                            }
                        },
                        { 
                            "$limit": 10 
                        }
                    ], function(err, result){
                        // let contributors = [];
                        // for(let kk = 0; kk < result.length; kk++){
                        //     contributors = [ ...contributors , ...result[kk].user ];
                        // }
                        list.top_contributors = result;
                        cb();
                        // if (err) return res.serverError(err);
                        // let lists_array = [];
                        // for(let k=0; k < result.length;k++){
                        //     if(result[k]._id){
                        //         lists_array.push(new ObjectId(result[k]._id));
                        //     }
                        // }
                        // List.find({
                        //     "_id": {
                        //         "$in": lists_array
                        //     }
                        // }).then(function(lsts){
                        //     let order_lists = [];
                        //     for(let ll = 0; ll < lists_array.length; ll++){
                        //         order_lists.push(lsts.find((item) => item.id == lists_array[ll]));
                        //     }
                        //     list.top_contributors = order_lists;
                        //     cb();
                        // }).catch(function(error){
                        //     console.log('Error');
                        //     console.log(error);
                        // });
                    });
                });
            }],
            function(){
                console.log("final results");
                res.status(200).json(list);
            });
            
            
        });
        
    },
    makeSlug: function (req,res) {
        let rc = 0;
        let sc = 0;
        waterfall([function(cb){
            List.find().then(function(lists){
                List.native(function(error, list){
                    console.log(error);
                    if (error) return res.serverError(err);
                    let bulk = list.initializeUnorderedBulkOp();
                    for(let i = 0; i < lists.length; i++){
                        
                        if(!lists[i].slug){
                            rc++;
                            slugHelper.makeSlug(lists[i].name).then(function(slg){
                                sc++;
                                console.log("Slug: ", slg);
                                // console.log("Counter: ", counter);
                                // console.log("List length: ", lists.length);
                                console.log('Id: ', lists[i].id);
                                bulk.find({ "_id" : new ObjectId(lists[i].id) }).update({ $set: { slug: slg }});
                                if(rc === sc){
                                    if(bulk.length > 0){
                                        console.log('Going to execute bulk query');
                                        bulk.execute(function (error) {
                                            console.log('Bulk query executed');
                                            if(error){
                                                console.log(error);
                                            }
                                            cb();                  
                                        });
                                    }else{
                                        cb();
                                    }
                                }
                            });
                        }
                    }
                });
            });
        }, function(cb){
            res.status(200).json({success: true});
        }]);
    },
    getFilteredLists: function(req, res){
        let listsMap = {};
        let rs;
        waterfall([function(cb){
            let lq = List.find();
            lq.sort({'createdAt' : 'DESC'}).limit(10);
            lq.exec(function(err, result){
                if(result){
                   rs = result;
                   listsMap.latest = result;
                   cb();
                }
            });
        },function(cb){
            Useritems.native(function(err, useritems){
                useritems.aggregate([
                    {
                        $group : {
                            _id : "$list_id",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $sort: {
                            "count": -1
                        }
                    },
                    { 
                        "$limit": 10 
                    }
                ], function(err, result){
                    if (err) return res.serverError(err);
                    let lists_array = [];
                    for(let k=0; k < result.length;k++){
                        if(result[k]._id){
                            lists_array.push(new ObjectId(result[k]._id));
                        }
                    }
                    List.find({
                        "_id": {
                            "$in": lists_array
                        }
                    }).then(function(lsts){
                        let order_lists = [];
                        for(let ll = 0; ll < lists_array.length; ll++){
                            order_lists.push(lsts.find((item) => item.id == lists_array[ll]));
                        }
                        listsMap.popular = order_lists;
                        cb();
                    }).catch(function(error){
                        console.log('Error');
                        console.log(error);
                    });
                });
            });
        }, 
        function(cb){
            let current_date = new Date();
            let prev_date = new Date(current_date.getDate() - 7);

            Useritems.native(function(error, uitems){
                uitems.aggregate([
                    {
                        '$match': {
                            'createdAt': {
                                $gt: prev_date
                            }
                        }
                    },
                    {
                        $group : {
                            _id : "$list_id",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $sort: {
                            "count": -1
                        }
                    },
                    { 
                        "$limit": 10 
                    }
                ],
                function(error, rslt){
                    if (error) return res.serverError(error);
                    let lists_array = [];
                    for(let k=0; k < rslt.length;k++){
                        if(rslt[k]._id){
                            lists_array.push(new ObjectId(rslt[k]._id));
                        }
                    }
                    List.find({
                        "_id": {
                            "$in": lists_array
                        }
                    }).then(function(lsts){
                        let order_lists = [];
                        for(let ll = 0; ll < lists_array.length; ll++){
                            order_lists.push(lsts.find((item) => item.id == lists_array[ll]));
                        }
                        listsMap.trending = order_lists;
                        cb();
                    }).catch(function(error){
                        console.log('Error');
                        console.log(error);
                    });
                });
            });
        },
        function(cb){
            const auth_header = req.headers['authorization'];
            if(auth_header){
                const auth_header_parts = auth_header.split(' ');
                if(auth_header_parts.length == 2 && auth_header_parts[0] === 'Basic'){
                    const user_id = auth.verify(auth_header_parts[1]);
                    if(user_id){
                        User.findOne({id: user_id}).then((user)=> {
                            if(user){
                                List.find({"user_id": user.id}).sort({'createdAt' : 'DESC'}).limit(10).exec(function(error, lists){
                                    listsMap.my_lists = lists;
                                    cb();
                                })
                            }
                        });
                    }
                    else {
                        cb();
                    }
                }
            }
            else{
                cb();
            }
        },
        function(cb){
            res.status(200).json(listsMap);
        }
    ]);
    },

};


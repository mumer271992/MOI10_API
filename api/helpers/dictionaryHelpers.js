var _ = require('underscore');
var db = require('mongodb');
var waterfall = require('async-waterfall');

module.exports = {

    wordFreq: function(string) {
        string = string.toLowerCase();
        var words = string.replace(/[.]/g, '').split(/\s/);
        var freqMap = {};
        words.forEach(function(w) {
            w = w.replace(/[^a-zA-Z0-9]/g, '');
            w = w.trim();
            if(w){
                if (!freqMap[w]) {
                    freqMap[w] = {count: 0, score: 0};
                }
                freqMap[w].count += 1;
            }
        });
    
        return freqMap;
    },
    calculateRankofWords: function(wordsMap) {
        var ranked_words_list = {};
        var sorted_keys = Object.keys(wordsMap).sort(function(a, b){
            return wordsMap[b].count - wordsMap[a].count;
        });
        for( let i = 0; i < sorted_keys.length; i++ ){
            ranked_words_list[sorted_keys[i]] = { ...wordsMap[sorted_keys[i]], rank: i + 1 }
        }
        return ranked_words_list;
    },
    // This method is for calculating score for top 20 words list for an i individual list
    calculateScoresOfWords: function(wordsMap){
        let keys = Object.keys(wordsMap);
        for(let i = 0; i < keys.length; i++){
            if(wordsMap.hasOwnProperty(keys[i])){
                let score = 100 - ( wordsMap[keys[i]].rank / keys.length ) * 100; 
                //console.log(`Score for ${keys[i]} is ${score}`);
                wordsMap[keys[i]].score = score;
            }
        }
        return wordsMap;
    },

    findMaxValueKey(obj){
        let maxValueKey;
        let keys = Object.keys(obj);
        maxValueKey = keys[0];
        for(let i = 0; i < keys.length; i++){
            if(obj[keys[i]].count > obj[maxValueKey].count){
                maxValueKey = keys[i]; 
            }
        }
        return maxValueKey;
    },

    convertWordsMapToDictionary: function(wordsMap){
        //console.log("Converting wrods map to dictionary");
        var dataArray = [];
        let keys = Object.keys(wordsMap);
        Dictionary.find({}).then(function(results){
            Dictionary.native(function(err, dictionary){
                if (err) return res.serverError(err);
                let bulk = dictionary.initializeUnorderedBulkOp();
                for(let i = 0; i < keys.length; i++){
                    let found = results.find(function(result){
                        return result.word === keys[i];
                    });
                    if(!found){
                        const obj = {
                            word: keys[i],
                            count: wordsMap[keys[i]].count,
                            rank: 0,
                            score: wordsMap[keys[i]].score
                        };
                        dataArray.push(obj);
                    }
                    else{
                        bulk.find({'word': keys[i] }).update({ $inc: {count: wordsMap[keys[i]].count }});
                    }
                }
                // var self = this;
                waterfall([
                    function(cb){
                        if(dataArray.length){
                            Dictionary.create(dataArray).then(function(results){
                                cb();
                            }).catch(function(err){
                                console.log("Error: ", err);
                            });
                        }else{
                            cb();
                        }
                    },function(cb){
                        if(bulk.length > 0){
                            bulk.execute(function (error) {
                                if(error){
                                    console.log(error);
                                }
                                cb();                  
                            });
                        }else{
                            cb();
                        }
                    },
                    function(cb) {
                        Dictionary.find({}).sort("count DESC").exec(function(err, sorted_results){
                            Dictionary.native(function(err, dictionary){
                                let bulk_query = dictionary.initializeUnorderedBulkOp();
                                for(let i = 0; i< sorted_results.length; i++){
                                    bulk_query.find({'word': sorted_results[i].word }).update({ $set: { rank: i + 1 }});
                                    if(i == sorted_results.length - 1){
                                        if(bulk_query.length > 0){
                                            bulk_query.execute(function(error){
                                                if(error){
                                                    console.log(error);
                                                }
                                            });
                                        }
                                        cb();
                                    }
                                }
                            });
                        });
                    }
                ],
                function(result){
                        console.log("Now Update scores of dictionary words.");
                        //self.calculateScoresOfMiniDictionary();
                        Dictionary.find().then(function(results){
                            //console.log("Dictionary length: ", results.length);
                            Dictionary.native(function(err, dictionary){
                                let blk = dictionary.initializeUnorderedBulkOp();
                                for(let j = 0; j < results.length; j++){
                                    let score = ( results[j].rank / results.length ) * 100;
                                    score = Math.round(score);
                                    if(score <= 0){
                                        score = 1;
                                    }
                                    blk.find({'word': results[j].word }).update({ $set: { score: score }});
                                    if(j == results.length - 1){
                                        if(blk.length > 0){
                                            blk.execute(function(error){
                                                if(error){
                                                    console.log(error);
                                                }
                                                //console.log("Bulk query executed and score calculated.");
                                            });
                                        }
                                    }
                                }
                            });    
                        }).catch(function(err){
                            console.log(err);
                        });
                    });
                
            });
        }).catch(function(err){
            console.log("Error: ", err);
        });
        //this.calculateScoresOfMiniDictionary();
    },
    calculateScoresOfMiniDictionary: function() {
        // Dictionary.find().then(function(dictionary){
        //     console.log("Dictionary length: ", dictionary.length);
        //     let factor = 1;
        //     let minValueWord = _.min(dictionary, function(word){ return word.count; });
        //     let minValueKey = minValueWord.word;
        //     factor = minValueWord.count * 100;
        //     console.log("Min Value factor: ", factor);
        //     Dictionary.native(function(err, dictionary){
        //         if (err) return res.serverError(err);
        //         dictionary.find().forEach(function(item){
        //             let score = factor / item.count;
        //             item.score = score;
        //             dictionary.save(item);
        //         });
        //     });    
        // }).catch(function(err){
        //     console.log(err);
        // });
        

        //return wordsMap;
    }
    
}
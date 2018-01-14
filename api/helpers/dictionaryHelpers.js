var _ = require('underscore');
var db = require('mongodb');
var waterfall = require('async-waterfall');

module.exports = {

    wordFreq: function(string) {
        string = string.toLowerCase();
        var words = string.replace(/[.]/g, '').split(/\s/);
        var freqMap = {};
        words.forEach(function(w) {
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
    // This method is for calculating score for top 20 words list for an i individual list
    calculateScoresOfWords: function(wordsMap){
        let scorePerCount = 1;
        let maxValueKey = this.findMaxValueKey(wordsMap);
        console.log("Max Value: ", maxValueKey);
        if(wordsMap.hasOwnProperty(maxValueKey)){
            scorePerCount = 100 / wordsMap[maxValueKey].count;
        }

        let keys = Object.keys(wordsMap);
        for(let i = 0; i < keys.length; i++){
            if(wordsMap.hasOwnProperty(keys[i])){
                let score = wordsMap[keys[i]].count * scorePerCount;
                console.log(`Score for ${keys[i]} is ${score}`);
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
        console.log("Converting wrods map to dictionary");
        var dataArray = [];
        let keys = Object.keys(wordsMap);
        Dictionary.find({}).then(function(results){
            Dictionary.native(function(err, dictionary){
                if (err) return res.serverError(err);
                let bulk = dictionary.initializeUnorderedBulkOp();
                console.log("Initialized un ordered mongo");
                console.log(bulk);
                for(let i = 0; i < keys.length; i++){
                    let found = results.find(function(result){
                        return result.word === keys[i];
                    });
                    if(!found){
                        console.log("Not found in dictionary");
                        const obj = {
                            word: keys[i],
                            count: wordsMap[keys[i]].count,
                            score: wordsMap[keys[i]].score
                        };
                        dataArray.push(obj);
                        console.log("New Dictionary items length: ",dataArray.length);
                    }
                    else{
                        console.log("Found in dictionary");
                        //result.count += wordsMap[keys[i]].count;
                        bulk.find({'word': keys[i] }).update({ $inc: {count: wordsMap[keys[i]].count }});
                    }
                }
                // var self = this;
                waterfall([
                    function(cb){
                        if(dataArray.length){
                            Dictionary.create(dataArray).then(function(results){
                                console.log("New words added into dictionary.");
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
                                    console.log("Bulk Execute has an error");
                                    console.log(error);
                                }
                                console.log("Dictionary existing words counts updated."); 
                                cb();                  
                            });
                        }else{
                            cb();
                        }
                    }
                ],
                function(result){
                        console.log("Now Update scores of dictionary words.");
                        //self.calculateScoresOfMiniDictionary();
                        Dictionary.find().then(function(dictionary){
                            console.log("Dictionary length: ", dictionary.length);
                            let scorePerCount = 1;
                            let maxValueWord = _.max(dictionary, function(word){ return word.count; });
                            let maxValueKey = maxValueWord.word;

                            scorePerCount = 100 / maxValueWord.count;
                            console.log("Min Value factor: ", scorePerCount);
                            Dictionary.native(function(err, dictionary){
                                if (err) return res.serverError(err);
                                dictionary.find().forEach(function(item){
                                    let score = item.count * scorePerCount;
                                    item.score = 100 - score;
                                    if(item.score < 1){
                                        item.score = 1;
                                    }
                                    dictionary.save(item);
                                });
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
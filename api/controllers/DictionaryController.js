/**
 * DictionaryController
 *
 * @description :: Server-side logic for managing dictionaries
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	// create: function(req, res){
    //     const data = [{word: 'founder', count: 25, score: 100},{word: 'computer', count: 20, score: 80}];
    //     Dictionary.create(data).then(function(dictionary){
    //         console.log("dictionary");
    //         console.log(dictionary);
    //         res.status(200).json(dictionary);
    //     }).catch(function(err){
    //         console.log("Error: ", err);
    //     });
    // }
    calculateScore: function(req,res){
        console.log("Now Update scores of dictionary words.");
        //self.calculateScoresOfMiniDictionary();
        Dictionary.find().then(function(results){
            console.log("Dictionary length: ", results.length);
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
                                console.log("Bulk query executed and score calculated.");
                                res.status(200).json({'success': true});
                            });
                        }
                    }
                }
            });    
        }).catch(function(err){
            console.log(err);
        });
    }
};


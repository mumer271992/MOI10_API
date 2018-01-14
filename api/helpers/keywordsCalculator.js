var dictionaryHelper = require('./dictionaryHelpers');

module.exports = {
    maintainKeywordsListFromList: function(list_id, cb){
        List.findOne({
            id: list_id
        })
        .then(function(list){
            var wordsMap;
            var merged_content = list.name + ' ' + list.description;
            console.log("Merged Content");
            console.log(merged_content);
            wordsMap = dictionaryHelper.wordFreq(merged_content);
            wordsMap = dictionaryHelper.calculateScoresOfWords(wordsMap);
            cb(wordsMap);
        })
        .catch(function(err){
            console.log(err);
        });
    },
    maintainKeywordsListFromListItem: function(item_id, cb){
        ListItem.findOne({
            id: item_id
        })
        .then(function(item){
            var wordsMap;
            var merged_content = item.name.concat(" " + item.description).concat(" " + item.url);
            wordsMap = dictionaryHelper.wordFreq(merged_content);
            cb(wordsMap);
        })
        .catch(function(err){
            console.log(err);
        });
    }
}
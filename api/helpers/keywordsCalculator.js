var dictionaryHelper = require('./dictionaryHelpers');

module.exports = {
    maintainKeywordsListFromList: function(list_id, cb){
        List.findOne({
            id: list_id
        })
        .then(function(list){
            var wordsMap;
            var merged_content = list.name.concat(" " + list.description);
            wordsMap = dictionaryHelper.wordFreq(merged_content);
            cb(wordsMap);
        })
        .catch(function(err){
            console.log();
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
            console.log();
        });
    }
}
var dictionaryHelper = require('./dictionaryHelpers');

var keywordsCalculator = module.exports = {
    maintainKeywordsListFromList: function(list_id, cb){
        List.findOne({
            id: list_id
        })
        .then(function(list){
            var wordsMap;
            var merged_content = list.name + ' ' + list.name + ' ' + list.name + ' ' + list.description;
            wordsMap = dictionaryHelper.wordFreq(merged_content);
            wordsMap = dictionaryHelper.calculateRankofWords(wordsMap);
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
            var merged_content = item.name + ' ' + item.name + ' ' + item.name + ' ' + item.description + ' ' + item.url;
            wordsMap = dictionaryHelper.wordFreq(merged_content);
            cb(wordsMap);
        })
        .catch(function(err){
            console.log(err);
        });
    },
    findReleventLists: function(current_list, lists){
        var current_words_list_keys = Object.keys(current_list.words_list);
        var isMatchingList = false;
        var relevant_lists = [];
        for(let i = 0; i < lists.length; i++){
            if(lists[i] && lists[i].words_list){
                isMatchingList = keywordsCalculator.matchBothLists(current_words_list_keys, Object.keys(lists[i].words_list), 10);
                if(isMatchingList){
                    relevant_lists.push(lists[i]);
                }
            }
        }
        return relevant_lists;
    },
    matchBothLists: function(current_words_lis, target_words_list, matching_criteria){
        var total_match_found = 0;
        for(let i = 0; i < current_words_lis.length; i++){
            var found = target_words_list.find((item)=> {
                return item === current_words_lis[i];
            });
            if(found){  
                total_match_found++;
            }
            if(i >= 19){
                break;
            }
        }
        return total_match_found >= matching_criteria ? true : false;
    }
}
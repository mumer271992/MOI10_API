var slugify = require('slugify');

module.exports = {
    makeSlug: function (str) {
        return new Promise(function (resolve, reject) {
            let slug = '';
            slug = slugify(str, {lower: true, remove: /[$*_+~.()'"!\-:@]/g});
            List.count({ 'slug': { 'contains': slug }}).exec(function countLists(error, count){
                if(error){
                    reject(error);
                }
                else{
                    
                    console.log('Slugs for '+ ' '+ str + ': ' + count);
                    if(count > 0){
                        count = count + 1;
                        slug = slug + "-" + count;
                        resolve(slug);
                    }else {
                        resolve(slug);
                    }
                }
            });
        });
    }
}
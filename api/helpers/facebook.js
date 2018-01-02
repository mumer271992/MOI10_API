var Promise = require('promise');
var FB = require('fb');


module.exports = {
    login: function(access_token){
        
        return new Promise((resolve, reject) => {
            console.log(access_token);
            FB.setAccessToken(access_token);
    
            FB.api(
            '/me',
            {"fields":['id','first_name','last_name','email']},
            function(user_info) {
                console.log(user_info);
                if(user_info.error){
                    return reject(user_info.error);
                }
                else{
                    resolve(user_info);
                }
            }
            );
        });    
    }
}
/*
** Simpe Twitter Shadowban Checker - js
** 2016 @xho
*/

var TSB = {

    searchBaseUrl: 'https://twitter.com/search?f=tweets&vertical=default&q=from%3A%40',

    init: function() {
        $('input').keypress(function (e) {
            if (e.which == 13) {
                var u = TSB.getUser();
                if(u) {
                    TSB.searchUser(u);
                }
                return false;    //<---- Add this line
            }
        });

        $('button').on('click', function () {
            var u = TSB.getUser();
            var validTwitterHandle = /^(?:@)?([A-Za-z0-9_])+$/g;
            var isValidTwitterHandle = u.match(validTwitterHandle);
            if(u && isValidTwitterHandle && isValidTwitterHandle != null) {
                TSB.searchUser(u);
            } else {
                TSB.isNotValidUserName();
            }
        });
    },

    getUser: function() {
        $('.results ul').empty();
        $('.results div').empty();

        var u = $('input').val().trim();
        if (!u) {
            $('header span').text('@user').removeClass('on');
            $('.results').slideUp().removeClass('searching');
            return false;
        }

        if (u.lastIndexOf('@', 0) === 0) {
            u = u.substring(1);
        }

        return u;
    },

    searchUser: function(u) {
        $('header span').text('@' + u).addClass('on');
        $('.results').slideDown().addClass('searching');

        $.ajax({
            method: 'GET',
            url: 'parsepage.php',
            data: { u: u },
//            processData: false
            // cache: false
        }).done(function(data) {
            var firstFoundTweet = $(data).find('li.stream-item:first-child');
            var firstFoundReply = $(data).find('li.stream-item .tweet[data-is-reply-to=true]');
            var liMessage = [];
            var pMessage = [];
            var proof = 0;

            if (firstFoundTweet.length) {
                liMessage.push('at least one tweet made by @' + u + ' was found');
            } else {
                liMessage.push('no tweets made by @' + u + ' were found');
                proof++;
            }
            if (firstFoundReply.length) {
                liMessage.push('at least one reply tweet made by @' + u + ' was found');
            } else {
                liMessage.push('no reply tweets made by @' + u + ' were found');
                proof++;
            }

            if (proof == 1) {
                pMessage.push(u +' might be shadowbanned.');
            }

            if (proof == 2) {
                pMessage.push('Apparently @' + u + ' <u>is shadowbanned</u>.');
            }

            if (proof > 1) {
                pMessage.push('First make sure the user exists, than you may also visit this <a target="_blank" href=\"' + TSB.searchBaseUrl + u + '\">link to a search on Twitter</a>. If you can\'t see any tweet made by @' + u + ', this user is most likely shadowbanned.');
            } else {
                    pMessage.push('Apparently ' + u + ' is <u>not shadowbanned</u>.');
            }

            $.each(liMessage, function( index, value ) {
                $('.results ul').append('<li>' + value + '</li>');
            });

            $.each(pMessage, function( index, value ) {
                $('.results div').append('<p>' + value + '</p>');
            });

        }).fail(function() {
            console.log('fail');
        }).always(function() {
            $('.results').removeClass('searching');
        });
    },
    
    isNotValidUserName: function() {
        /*Warn User*/
        $('header span').text('Who?').addClass('on');
        console.log('bad username');

        var pMessage = [];
        pMessage.push('What you entered was not a twitter handle...');
        $.each(pMessage, function( index, value ) {
            $('.results div').append('<p>' + value + '</p>');
        });
    }

};

$(document).ready(function() {
    TSB.init();
});

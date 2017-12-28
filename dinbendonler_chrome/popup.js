document.addEventListener('DOMContentLoaded', function() {
    // register button click event
    document.getElementById('login').addEventListener('click', function() {
        login();
    });
    document.getElementById('logout').addEventListener('click', function() {
        logout();
    });
    document.getElementById('whatToEat').addEventListener('click', function() {
        whatToEat();
    });
    document.getElementById('viewOrder').addEventListener('click', function() {
        viewOrder();
    });
    document.getElementById('order').addEventListener('click', function() {
        order();
    });
    document.getElementById('reminder').addEventListener('click', function() {
        reminder();
    });

    tryLogin();
});

var savedAccount = '';
var serviceUrl = 'http://10.62.145.145/oService/';

function setImage(url){
	$('#image').attr('src', url).show();
}

function tryLogin() {
    // get saved account/password
    chrome.storage.local.get(['account', 'password'], function(values) {
        if (values.account == null || values.account == ''
                || values.password == null || values.password == '') {
            $('#div_login').show();
			setImage('04.png');
            return;
        }

        // cache globally
        savedAccount = values.account;

        $('#div_message').html('正在登入...').show();

        var url = serviceUrl + 'Pass.asp?User=' + values.account + '&Pwd=' + values.password + '&Action=ChkPass';

        $.ajax({url: url, timeout: 3000,
            success: function(result) {
                $('#div_message').html('').hide();

                if (result.indexOf('密碼錯誤') >= 0) {
				    $('#div_message').html('密碼錯誤').show();
                    $('#div_login').show();
					setImage('04.png');
                } else if (result.indexOf('您尚未登錄基本資料') >= 0) {
		    		$('#div_message').html('您尚未登錄基本資料').show();
                    $('#div_login').show();
					setImage('04.png');
                } else {
                    $('#div_login').hide();
                    $('#div_info').show();
                    order();
                }
            },
            error: function(x, t, m) {
                $('#div_message').html('連接不上訂便當伺服器: 10.62.4.122').show();
            }
        });
    });
}

function login() {
    var account = document.getElementById('account');
    var password = document.getElementById('password');

    if (account.value == '' || password.value == '') {
		$('#div_message').html('請輸入帳號密碼').show();
        return;
    }

    var stored_values = {
        'account' : account.value,
        'password' : password.value
    };

    // save locally and try to login
    chrome.storage.local.set(stored_values, function() {
        tryLogin();
    });
};

function logout() {
    // clear saved data
    var stored_values = {
        'account' : '',
        'password' : ''
    };
    chrome.storage.local.set(stored_values, function() {
        window.close();
    });
}

function setupMenuEffect(selected) {
    $('.menu_item').removeClass('menu_item_selected');
    $('#' + selected).addClass('menu_item_selected');

    $('.menu_item').hover(
        function() {
            $(this).addClass('menu_item_hover');
        },
        function() {
            $(this).removeClass('menu_item_hover');
        }
    );
}

function viewOrder() {
    // url = serviceUrl + 'Dinner/InqByDep2.asp?User=' + savedAccount;
    // $('#div_content').html('<iframe id="iframe" width="100%" height="179px" frameborder="0" src="' + url + '"></iframe>');

    var today = new Date();
    today.setDate(today.getDate() + 1);
    var strDate = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
    today.setDate(today.getDate() + 7);
    var endDate = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();

    url = serviceUrl + 'Dinner/InqByPersonal.asp?UserID=' + savedAccount + '&StrDate=' + strDate + '&EndDate=' + endDate;

    $.get(url, function(result) {
        var content = capture(result, '<table border="1" cellspacing="0" cellpadding="1"', '</table>');
        $('#div_content').html('<div class="div_content_item"><center>' + content + '</div>');
    });

    setupMenuEffect('viewOrder');

	setImage('01.png');
}

function whatToEat() {
    // url = serviceUrl + 'Dinner/InqByDepNew.asp';
    // $('#div_content').html('<iframe id="iframe" width="100%" height="179px" frameborder="0" src="' + url + '"></iframe>');

    var today = new Date();
    var strDate = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();

    url = serviceUrl + 'Dinner/InqByPersonal.asp?UserID=' + savedAccount + '&StrDate=' + strDate + '&EndDate=' + strDate;

    $.get(url, function(result) {
        var content = capture(result, '<table border="1" cellspacing="0" cellpadding="1"', '</table>');
        $('#div_content').html('<div class="div_content_item"><center>' + content + '</div>');
    });

    setupMenuEffect('whatToEat');

	setImage('01.png');
}

function reminder() {
	$('#div_content').html($('#div_reminder').html());
	
	$('.div_content_item').hover(function() {
		$(this).addClass('div_content_item_hover');
	}, function() {
		$(this).removeClass('div_content_item_hover');
	});
	
	// load settings from storage
	chrome.storage.local.get('reminder_trigger_hour', function(values) {
        $('#reminder_trigger_hour_' + values.reminder_trigger_hour).removeClass('div_content_item');
		$('#reminder_trigger_hour_' + values.reminder_trigger_hour).addClass('div_content_item_selected');
	});
	
	$('.div_content_item').click(function() {
		var hour = $(this).attr('hour');
		var stored_values = {
			'reminder_trigger_hour' : hour
		};
		chrome.storage.local.set(stored_values, function() {
			// update alarm
			chrome.alarms.clear('reminder');
			
			if (hour == '0') {
				// don't remind
			} else {
				var now = new Date();
				var todayAlarm = new Date();
				todayAlarm.setHours(hour, 0 , 0, 0);
					
				var next = todayAlarm;
				if (now.getTime() >= todayAlarm.getTime()) {
					// tomorrow
					next.setDate(next.getDate() + 1);
				}
					
				chrome.alarms.create('reminder', {when: next.getTime()});
			}

			// refresh
			reminder();
		});
	});

	setupMenuEffect('reminder');

	setImage('03.png');
}

function capture(fullText, fromKeyword, toKeyword) {
    var from = fullText.indexOf(fromKeyword);
    var to = fullText.indexOf(toKeyword, fromKeyword);
    return fullText.substring(from, to);
}

function order() {
    url = serviceUrl + 'Dinner/Order.asp?User=' + savedAccount;

    $.get(url, function(result) {
        if (result.indexOf('逾時請自理') >= 0) {
            // can't order now
            $('#div_content').html('<div class="div_content_item" style="text-align: center; color: #885226; font-weight: bold">下次請早 ^.&lt;</div>');

			setImage('02.png');
        } else {
            var content = '<div>';

            var div_content_hidden = document.getElementById('div_content_hidden');

            div_content_hidden.innerHTML = result;

            $('option').each(function() {
                content += '<div class="div_content_item">' + $(this).val() + '</div>';
            });

            // if already ordered, add cancel button
            if (result.indexOf('尚未申訂') == -1) {
                content += '<div class="cancel_item">取消預訂</div>';
			}

            content += '</div>';

            div_content_hidden.innerHTML = '';
            $('#div_content').html(content);

            $('.div_content_item, .cancel_item').hover(function() {
                $(this).addClass('div_content_item_hover');
            }, function() {
                $(this).removeClass('div_content_item_hover');
            });

            $('.cancel_item').click(function() {
                cancel();
            });

            $('.div_content_item').click(function() {
                url = serviceUrl + 'Dinner/Order.asp?User=' + savedAccount + '&Action=Order&DinnerType=1&PackName=' + $(this).html();
                $.get(url, function(result) {

                    if (result.indexOf('已完成訂餐') >= 0) {
                        alert('已完成訂餐');
                    } else if (result.indexOf('選擇已修改') >= 0) {
                        alert('選擇已修改');
                    } else {
                        alert('訂餐失敗');
                    }

                    viewOrder();       
                });
            });

			setImage('04.png');
        }
    });

    setupMenuEffect('order');
}

function cancel() {
    url = serviceUrl + 'Dinner/Delete.asp?User=' + savedAccount;
    $.get(url, function(result) {
        if (result.indexOf('訂餐已取消') >= 0) {
            alert('取消成功');
        } else {
            alert('取消失敗');
        }
        viewOrder();
    });
}

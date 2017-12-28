chrome.runtime.onInstalled.addListener(function() {
	// register the next alarm
	registerNextAlarm();
	
	// init settings
	var stored_values = {
        'reminder_trigger_hour' : 10	// 10:00am
    };
    chrome.storage.local.set(stored_values, function() {});
});

chrome.windows.onCreated.addListener(function() {
	// register the next alarm
	registerNextAlarm();
})

function registerNextAlarm() {
	chrome.alarms.clear('reminder');
	
	// load settings from storage
	chrome.storage.local.get('reminder_trigger_hour', function(values) {
        if (values.reminder_trigger_hour == '0') {
			// don't remind
		} else {
			var now = new Date();
			var todayAlarm = new Date();
			todayAlarm.setHours(values.reminder_trigger_hour, 0 , 0, 0);
			
			var next = todayAlarm;
			if (now.getTime() >= todayAlarm.getTime()) {
				// tomorrow
				next.setDate(next.getDate() + 1);
			}
			
			chrome.alarms.create('reminder', {when: next.getTime()});	
		}
	});
}

chrome.alarms.onAlarm.addListener(function(alarm) {
	// only handle alarm during Monday and Friday
	var dow = new Date().getDay();
	if (dow >=1 && dow <= 5) {
        showNotification();
	}
	
	// register the next alarm
	registerNextAlarm();
});

function showNotification() {
/*    var notification_options = {
        type : 'basic',
        priority : 2,
        iconUrl : 'icon.png',
        title : '訂扁冬了沒',
        message : '訂扁冬了沒提醒您記得訂扁冬'
    };

    chrome.notifications.create('', notification_options, function() {
        chrome.notifications.onClicked.addListener(function() {
            alert('');
        });
    });
*/
    alert('訂扁冬了沒提醒您記得訂扁冬');
}

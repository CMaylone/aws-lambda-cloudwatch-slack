console.log('[Amazon CloudWatch Notification]');

/**
 * Configuration
 */
var SLACK_WEBHOOK_URL = 'YOUR_SLACK_URL',
    CHANNEL = '#aws-monitor',
    MENTION = '<!channel>',
    ALARM_COLOR = '#d50200',
    DISPLAY_NAME = 'AWS CloudWatch',
    ICON_EMOJI = ':aws:';

var https = require ('https');
var querystring = require ('querystring');

exports.handler = function(event, context) {
	console.log(event.Records[0]);

	// Parse SNS Event information
	var message = JSON.parse(event.Records[0].Sns.Message);

	var postData = JSON.stringify({
        "icon_emoji": ICON_EMOJI,
        "username": DISPLAY_NAME,
        "attachments": [
            {
                "fallback": message.AlarmName,
                "mrkdwn_in": ["text"],
                "pretext": MENTION,
                "title": `Alarm: ${message.AlarmName}`,
                "text": `${message.Trigger.MetricName} - ${message.NewStateReason}`,
                "title_link": createCloudWatchUrl(message.AlarmName),
                "color": ALARM_COLOR,
                "channel": CHANNEL,
                "ts": getUnixTime(message.StateChangeTime)
            }
        ]
	});

	console.log(postData);

	var options = {
		hostname: "hooks.slack.com",
		path: SLACK_WEBHOOK_URL,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': postData.length
		}
	};

	var req = https.request(options, function(res) {
		console.log('Got response: ' + res.statusCode);
		res.on('data', function(chunk) {
			console.log('BODY: '+chunk);
			context.done(null, 'done!');
		});
	}).on('error', function(e) {
		context.done('error', e);
	});

	req.write(postData);
	req.end();
};

/**
 * Gets the Unix time from a date object
 */
function getUnixTime(date) {
    // getTime() return time since Epoch in ms and needs to be converted to seconds
    return new Date(date).getTime() / 1000;
}

/**
 * Creates a URL to the Alarm
 */
function createCloudWatchUrl(alarmName) {
    return `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarm:alarmFilter=inAlarm;name=${alarmName}`
}

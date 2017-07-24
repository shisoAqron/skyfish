'use strict';
const fs = require('fs');
const PubNub = require('pubnub');

let bf_token = './token.txt'; 
//if(!isExistFile(bf_token)) 
let token = fs.readFileSync(bf_token, 'utf8');

let pubnub = new PubNub({
    subscribeKey: token
});

/*
{
  "product_code": "BTC_JPY",
  "timestamp": "2015-07-08T02:50:59.97",
  "tick_id": 3579,
  "best_bid": 30000,
  "best_ask": 36640,
  "best_bid_size": 0.1,
  "best_ask_size": 5,
  "total_bid_depth": 15.13,
  "total_ask_depth": 20,
  "ltp": 31690,
  "volume": 16819.26,
  "volume_by_product": 6819.26
}
*/

/*始値・終値・高値・安値は自分でやるしかない？
データの保持とかどうしようか
*/

var ticker_log = [];

var p_ltp = 0;
pubnub.addListener({
    message: function (message) {
        //console.log(message.channel, message.message);
        var ltp = message.message['ltp'];
        //表示はローカルのほうが見やすいけど，処理的にはutcのままがいいかも
        var timestamp = message.message['timestamp'];
        //var timestamp = new Date(message.message['timestamp']);

        if(p_ltp == ltp) return;
        var text = "";
        if(p_ltp > ltp){
            text = "down";
        }else{
            text = "up  ";
        }
        if(p_ltp == 0) {
            console.log("ltp caputre start : "+ltp+" ("+timestamp+")");
        }else{
            console.log("ltp is "+text+" : "+ltp+" ("+timestamp+")");
        }
        var content = {
            'timestamp': timestamp,
            'ltp':ltp
        };
        ticker_log.push(content);
        console.log(ticker_log);
        p_ltp = ltp;
        
    }
});
pubnub.subscribe({
    channels: ['lightning_ticker_BTC_JPY']
});

/*選択した細かさに応じて区切りとなる時間のリセットがいる
15分→０，１５，３０，４５でリセット
30分→０，３０でリセット
60分→０でリセット
そもそもデータをDBにﾊﾞｰｯと取っておいて後でで回すほうが良いのでは？
*/

var span = 1;//minutes
function timer(){
    console.log("interval : "+span+" minutes");
}
var S_I = setInterval(timer,span*60*1000);

/*リセット
clearInterval(S_I);
S_I = setInterval(timer,span*1000);
*/


function isExistFile(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}
'use strict'
import fs from 'fs'
import path from 'path'
import PubNub from 'pubnub'
import SlackBot from 'slackbots'
import controller from './controllers'

const isExistFile = (file) => {
  try {
    fs.statSync(file)
    return true
  } catch (err) {
    if (err.code === 'ENOENT') return false
  }
}

const token = path.join(path.dirname(__dirname), 'token.json')
if (!isExistFile(token)) {
  console.log('tokenFile(' + token + ') is not exist!!!!')
} else {
  const tokenObj = JSON.parse(fs.readFileSync(token, 'utf8'))
  const pubnub = new PubNub({
    subscribeKey: tokenObj.bitflyer.token
  })

  const bot = new SlackBot({
    token: tokenObj.Slack.token, name: tokenObj.Slack.botname
  })

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
  let ticker_log = []
  let p_ltp = 0
  let ltp = 0
  pubnub.addListener({
    message: (message) => {
    //console.log(message.channel, message.message);
      ltp = message.message['ltp']
      //表示はローカルのほうが見やすいけど，処理的にはutcのままがいいかも
      let timestamp = message.message['timestamp']
      //var timestamp = new Date(message.message['timestamp']);

      if (p_ltp == ltp) return
      const text = p_ltp > ltp ? 'down' : 'up'
      p_ltp == 0 ?
        console.log('ltp caputre start : ' + ltp + ' (' + timestamp + ')') :
        console.log('ltp is ' + text + ' : ' + ltp + ' (' + timestamp + ')' )
      const content = {
        'timestamp': timestamp,
        'ltp':ltp
      }
      ticker_log.push(content)
      console.log(ticker_log)
      p_ltp = ltp

    }
  })
  pubnub.subscribe({
    channels: ['lightning_ticker_BTC_JPY']
  })

  /*選択した細かさに応じて区切りとなる時間のリセットがいる
  15分→０，１５，３０，４５でリセット
  30分→０，３０でリセット
  60分→０でリセット
  そもそもデータをDBにﾊﾞｰｯと取っておいて後でで回すほうが良いのでは？
  */

  //最初はltpが０なのでどこでタイマーを作動させるか
  const span = 1//minutes
  const timer = () => {
    //console.log('interval : ' + span + ' minutes')
    console.log('percentage:' + '')
    //bot.postMessage('sandbox', span + '分に' + ltp, params)
    ticker_log = []
  }
  setInterval(timer, span * 60 * 1000)

  /*リセット
  clearInterval(S_I);
  S_I = setInterval(timer,span*1000);
  */

  bot.on('start', () => {
    //bot.postMessageToChannel('sandbox', 'btcするで')
  })

  bot.on('message', (data) => {
    console.log(data)
    if (data['username'] == tokenObj.Slack.botname || data['username'] == 'undefined') return
    if (data['subtype']  == 'bot_message') return //ほかのbot除けならこっちでいいかも
    if (data['type'] == 'message' && data['text'] != undefined) {
      if (data['text'].match(/値段/)) {
        const params = {
          //icon_emoji: ':cat:'
        }
        bot.postMessage(data['channel'], '今の価格は' + ltp, params)
      }
    }
  })

}

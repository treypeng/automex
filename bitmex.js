const request = require('request-promise');
const crypto = require('crypto');
// const config = require('./config');
const querystring = require("querystring");

const XBt_TO_XBT = 1 / 100000000;
const ROUND_USD = 5;
const SAFE_REDUCE = 5;

const API_PATH = '/api/v1';

class BitMEX
{
  constructor(config)
  {
    this.url = config.url || 'https://testnet.bitmex.com';

    this.key = config.id;
    this.secret = config.secret;
  }

  async instrument(symbol)
  {
    let verb = 'GET';
    let path = `${API_PATH}/instrument?symbol=${symbol}&count=1`;
    let body = {};

    let sbody = JSON.stringify(body)

    const req = {
      headers: this._header(verb, path, 0, sbody),
      url:`${this.url}${path}`,
      method: verb,
      body: sbody
    };

    let res = await request(req);
    let o = JSON.parse(res);
    if (Array.isArray(o))
      if (o.length == 1)
        o = o[0]
      else if (o.length == 0) o = {error: `Nothing returned for ${symbol}`}

    return o;
  }

  async size(symbol, pcbalance=0.98, leverage=1)
  {
    let i = symbol == 'XBTUSD' ? 'xbt' : symbol;
    let balance = await this.balance();
    let ins = await this.instrument(i);
    let xbt = (balance.availableMargin * XBt_TO_XBT) * pcbalance;

    let usd = xbt * ins.lastPrice;
    let num = (((usd - (usd % ROUND_USD)) * leverage)) <<0;

    return Math.max(num, 0);
  }

  async balance()
  {
    let verb = 'GET';
    let path = `${API_PATH}/user/margin`;
    let body = {};

    let sbody = JSON.stringify(body)

    const req = {
      headers: this._header(verb, path, 0, sbody),
      url:`${this.url}${path}`,
      method: verb,
      body: sbody
    };

    let res = await request(req);
    let o = JSON.parse(res);
    if (Array.isArray(o))
      if (o.length == 1)
        o = o[0]
      else if (o.length == 0) o = {error: `Nothing returned for ${symbol}`}

    return o;

  }

  async position(symbol, action, params)
  {
    let body = {};
    switch(action)
    {
      case 'close':
        body = {symbol:symbol, execInst:'Close', ordType:"Market"};
        break;
      case 'open':
        body = {symbol:symbol, ordType:'Market'};
        Object.assign(body, params);
        break;
      case 'get':
        return await this._get_position(symbol);
        break;

    }

    let verb = 'POST';
    let path = `${API_PATH}/order`;

    let sbody = JSON.stringify(body)

    const req = {
      headers: this._header(verb, path, 0, sbody),
      url:`${this.url}${path}`,
      method: verb,
      body: sbody
    };

    let res = await request(req);
    let o = JSON.parse(res);
    if (Array.isArray(o))
      if (o.length == 1)
        o = o[0]
      else if (o.length == 0) o = {error: `Nothing returned for ${symbol}`}

    return o;


  }

  async _get_position(sym)
  {
    let filter = encodeURIComponent(`filter={"symbol":"${sym}"}`)

    let verb = 'GET';
    let path = `${API_PATH}/position?${filter}`;
    let body = {};

    let sbody = JSON.stringify(body);

    const req = {
      headers: this._header(verb, path, 0, sbody),
      url:`${this.url}${path}`,
      method: verb,
      body: sbody
    };

    let res = await request(req);
    let o = JSON.parse(res);
    if (Array.isArray(o))
      if (o.length == 1)
        o = o[0]
      else if (o.length == 0) o = {error: `Nothing returned for ${symbol}`}

    return o;

  }

  _header(verb, path, expires=0, body={})
  {
    expires = expires || Math.round(new Date().getTime() / 1000) + 60;
    let signature = this._signature(verb, path, expires, body);
    //taken from bitmex api docs
    return {
      'content-type' : 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
      // https://www.bitmex.com/app/apiKeysUsage for more details.
      'api-expires': expires,
      'api-key': this.key,
      'api-signature': signature
    };
  }

  _signature(verb, path, expires=0, body={})
  {
    return crypto.createHmac('sha256', this.secret).update(verb + path + expires + body).digest('hex');
  }
}

module.exports = BitMEX;

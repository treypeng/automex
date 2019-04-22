
const config = require('./example-config.js');
const notifier = require('mail-notifier');
const BitMEX = require('./bitmex');
const querystring = require("querystring");

const SUBJECT = "TradingView Alert:";

const USE_PERCENT_BALANCE = 0.98;
const USE_LEVERAGE = 1.5;

let usemex = process.argv[2] || 'test';

let cfg = config.bitmex[usemex];
console.log(`Using config: ${cfg.description}`);

let bitmex = new BitMEX(cfg);


(async function() {

const imap = {
  user: config.mail.user,
  password: config.mail.pass,
  host: config.mail.host,
  port: 993, // imap port
  tls: true,// use secure connection
  tlsOptions: { rejectUnauthorized: false }
};


// listen mail inbox
const n = notifier(imap);
n.on('end', () => n.start()) // session closed
  .on('mail', parsemail)
  .on('connected', p => console.log(`Connected <${config.mail.user}>. Listening...`))
  .start();

})();


// triggered on new email
async function parsemail(mail)
{
  let subject = mail.subject;
  if (subject.toLowerCase().startsWith(SUBJECT.toLowerCase()))
  {
      let order = JSON.parse(subject.replace(SUBJECT, '').trim());
      if (order.bot)
      {
        switch(order.bot)
        {
          case 'wildfire':
            // console.log(order.direction, order.symbol);
            let sym = order.symbol.toUpperCase();
            console.log((new Date(Date.now())).toISOString());
            console.log(`New order: ${order.direction} => ${order.symbol}`);
            console.log(`Getting current position...`);
            let p = await bitmex.position(sym,'get');
            let res;

            if (p.isOpen)
            {
              console.log(`Position is open (${p.currentQty} USD contracts), closing it...`);
              res = await bitmex.position(sym, 'close');
              if (res.ordStatus != 'Filled')
              {
                console.log(`Error: unexpected order status ='${res.ordStatus}'. Aborting.`);
                console.log(res);
                return;
              }
              console.log(`Closed ${res.orderQty} contract position (${res.side})`);
            } else {
              console.log(`No position open.`);
            }

            console.log(`Calculating position size...`);
            let contracts = await bitmex.size(sym, USE_PERCENT_BALANCE, USE_LEVERAGE);

            console.log(`Opening ${order.direction} position...`);
            let side = order.direction.toLowerCase() == 'long' ? 'Buy' : 'Sell';
            res = await bitmex.position(sym, 'open', {side: side, orderQty: contracts});

            if (res.ordStatus != 'Filled')
            {
              console.log(`Error: unexpected order status ='${res.ordStatus}'. Aborting.`);
              return;
            }

            console.log(`Done! Opened ${res.side == 'Sell' ? 'SHORT' : 'LONG'} position of ${res.orderQty} USD contracts`);

            break;
        }
      }
  }
  // mail => console.log(mail.from[0].address, mail.subject)

}

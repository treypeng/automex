
module.exports =
{
  mail: {
    user: 'your_email_username',
    pass: 'your_password',
    host: 'your_email_host'
  },

  bitmex: {
    test:{
        description: 'BitMEX TESTNET',
        id:'a2HUumZWZJthqwq4h4TlpyxB',
        secret: 'PcJBE9RxKVZrGZwzbyxhi4bdlt3_y3CNRCEYqohK4bDcBjmx',
        url: 'https://testnet.bitmex.com'
    },
    live: { // LIVE !
        description: '⚠️ LIVE BitMEX account',
        id: 'api_id',
        secret: 'api_secret',
        url: 'https://www.bitmex.com'
    }
  }
}

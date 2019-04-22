super hacked together script for closing and opening mex positions
runs from email (IMAP). Put some JSON in the tradingview alert text box e.g.

```
{"bot":"wildfire", "direction":"short", "symbol":"xbtusd"}
```


`npm install` it as usual
always try with testnet first which is the default:

```
node main
```

you have to explicitly state you want to load the live config:
```
node main live
```

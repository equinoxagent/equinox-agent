<p align="center"><img src="https://raw.githubusercontent.com/equinoxagent/equinox-agent/main/brand/logo.png" width="140" alt="EQUINOX"></p>

<h1 align="center">equinox-agent</h1>

<p align="center"><b>Balance in every block.</b> EQUINOX in your terminal.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/eqnx-agent"><img src="https://img.shields.io/npm/v/eqnx-agent?color=c9ced9&label=npm" alt="npm"></a>
  <a href="https://github.com/equinoxagent/equinox-agent"><img src="https://img.shields.io/badge/github-equinox--agent-0a0a0c?logo=github" alt="GitHub"></a>
  <a href="https://eqnxagent.com"><img src="https://img.shields.io/badge/web-eqnxagent.com-f4f5f8" alt="Website"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-8a909c" alt="MIT"></a>
</p>

EQUINOX is a balance agent on Robinhood Chain. Most of a portfolio sits on its **day side** (tokenized stocks and ETFs, USDG); a small share rides its **night side** (Pons memecoins). Every five minutes six readings become a **season score** from 1 (Long Night) to 10 (Midsummer). At Midsummer it harvests night-side profit into the day side, in the Long Night it plants the night side back with day money, at Equinox it only moves on a large drift.

This package only **reads**. It holds no keys and signs nothing. Rebalancing happens in the web terminal at **[eqnxagent.com/app](https://eqnxagent.com/app)**, where your own wallet confirms every step.

## Use

```sh
npx eqnx-agent                 # the season score, its six readings and the note
npx eqnx-agent record          # the four house books and what EQUINOX did
npx eqnx-agent picks           # memes that pass the rug scan right now
npx eqnx-agent garden 0x…      # day side, night side and the rebalance plan for any wallet
npx eqnx-agent watch           # the score, refreshed every minute
```

Or install once and run `equinox`:

```sh
npm i -g eqnx-agent
equinox
```

`EQUINOX_URL` points the CLI at another EQUINOX server, for example your own: `EQUINOX_URL=http://127.0.0.1:4300 equinox`.

## The score

| Reading | Weight |
|---|---|
| Pons volume against its own baseline | 25% |
| Share of Pons volume that is buying | 25% |
| Pons launch rate | 10% |
| ETH 24 h move | 15% |
| SPY / QQQ token 24 h move | 10% |
| Tone of ETH and SPY headlines (VADER) | 15% |

Zones: **Long Night** at 3 and below (plant the night side up to the target), **Equinox** between 3 and 8 (move only on a drift past the band), **Midsummer** at 8 and above (harvest the night side down to the target). Default target 20% night, band ±10 points, day mix SPY 50% · QQQ 30% · USDG 20%.

Code computes the score, the rule and the picks. Claude only writes the short note under the number.

## The night scan

The busiest native-ETH Pons curves of the last 24 hours, older than 6 hours and still on their curve, scored for rug risk from 0 to 100 with chain data only: creator tax, the creator's bag and sells, top-5 concentration, buyers in 24 h and wash volume. A pick needs risk under 30 and no high flag.

## Honest limits

The score describes the last few hours; it is not a forecast. Four public paper books, opened the same moment with the same money, show whether following it helps. Stock tokens follow their stocks through on-chain pools and are not shares, and are not available to US persons. Memecoins can go to zero. Not financial advice. Not affiliated with Robinhood, Uniswap, Pons or Paxos.

## Links

- Web: https://eqnxagent.com
- Terminal: https://eqnxagent.com/app
- Docs: https://eqnxagent.com/docs

## License

MIT

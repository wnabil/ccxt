//  ---------------------------------------------------------------------------

import Exchange from './abstract/pionex.js';
import { BadRequest, AuthenticationError, InsufficientFunds, OrderNotFound, DDoSProtection, DuplicateOrderId, PermissionDenied, BadSymbol, InvalidAddress, ArgumentsRequired } from './base/errors.js';
import { TICK_SIZE } from './base/functions/number.js';
import { sha256 } from './static_dependencies/noble-hashes/sha256.js';
import type { Balances, Dict, Int, Market, MarketType, Num, OHLCV, Order, OrderBook, OrderSide, OrderType, OrderRequest, Str, Strings, Ticker, Tickers, Trade, int } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class ace
 * @augments Exchange
 */
export default class pionex extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'pionex',
            'name': 'Pionex',
            'countries': [ 'EU' ],
            'rateLimit': 100,
            'version': 'v1',
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': undefined,
                'swap': undefined,
                'future': undefined,
                'option': undefined,
                'cancelAllOrders': true,
                'cancelOrder': true,
                'cancelOrders': false,
                'closeAllPositions': false,
                'closePosition': false,
                'createDepositAddress': false,
                'createMarketOrder': true,
                'createOrder': true,
                'createOrders': false, // TODO
                'createPostOnlyOrder': true,
                'createReduceOnlyOrder': false,
                'createStopLimitOrder': false,
                'createStopMarketOrder': false,
                'createStopOrder': false,
                'fetchAccounts': false,
                'fetchBalance': true,
                'fetchBorrowInterest': false,
                'fetchBorrowRateHistory': false,
                'fetchClosedOrders': false,
                'fetchCrossBorrowRate': false,
                'fetchCrossBorrowRates': false,
                'fetchDeposit': false,
                'fetchDepositAddress': false,
                'fetchDepositAddresses': false,
                'fetchDepositAddressesByNetwork': false,
                'fetchDeposits': false,
                'fetchDepositsWithdrawals': false,
                'fetchFundingHistory': false,
                'fetchFundingRate': false,
                'fetchFundingRateHistory': false,
                'fetchFundingRates': false,
                'fetchIndexOHLCV': false,
                'fetchIsolatedBorrowRate': false,
                'fetchIsolatedBorrowRates': false,
                'fetchLedger': false,
                'fetchLedgerEntry': false,
                'fetchLeverageTiers': false,
                'fetchMarketLeverageTiers': false,
                'fetchMarkets': true,
                'fetchMarkOHLCV': false,
                'fetchMyTrades': true,
                'fetchOHLCV': false,
                'fetchOpenInterest': false,
                'fetchOpenInterestHistory': false,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrderBooks': true,
                'fetchOrders': true,
                'fetchOrderTrades': true,
                'fetchPosition': false,
                'fetchPositionHistory': false,
                'fetchPositionMode': false,
                'fetchPositions': false,
                'fetchPositionsForSymbol': false,
                'fetchPositionsHistory': false,
                'fetchPositionsRisk': false,
                'fetchPremiumIndexOHLCV': false,
                'fetchTicker': false,
                'fetchTickers': true,
                'fetchTrades': true,
                'fetchTradingLimits': false,
                'fetchTransactionFee': false,
                'fetchTransactionFees': false,
                'fetchTransactions': false,
                'fetchTransfers': false,
                'fetchWithdrawAddresses': false,
                'fetchWithdrawal': false,
                'fetchWithdrawals': false,
                'reduceMargin': false,
                'setLeverage': false,
                'setMargin': false,
                'setMarginMode': false,
                'setPositionMode': false,
                'signIn': false,
                'transfer': false,
                'withdraw': false,
            },
            'timeframes': {
                '1m': '1M',
                '5m': '5M',
                '15m': '15M',
                '30m': '30M',
                '1h': '60M',
                '4h': '4H',
                '8h': '8H',
                '12h': '12H',
                '1d': '1D',
            },
            'urls': {
                'api': {
                    'public': 'https://api.pionex.com',
                    'private': 'https://api.pionex.com',
                },
                'www': 'https://www.pionex.com/',
                'doc': 'https://pionex-doc.gitbook.io/apidocs',
                'fees': 'https://www.pionex.com/en/fees',
            },
            'api': {
                'public': {
                    'get': {
                        'common/symbols': 5,
                        'market/trades': 1,
                        'market/depth': 1,
                        'market/tickers': 1,
                        'market/bookTickers': 1,
                        'market/klines': 1,
                    },
                },
                'private': {
                    'get': {
                        'account/balances': 1,
                        'trade/order': 1,
                        'trade/orderByClientOrderId': 1,
                        'trade/openOrders': 5,
                        'trade/allOrders': 5,
                        'trade/fills': 5,
                        'trade/fillsByOrderId': 5,
                    },
                    'post': {
                        'trade/order': 1,
                        'trade/massOrder': 1,
                    },
                    'delete': {
                        'trade/order': 1,
                        'trade/allOrders': 1,
                    },
                },
            },
            'fees': {
                'trading': {
                    'tierBased': false,
                    'percentage': true,
                    'taker': this.parseNumber ('0.0005'),
                    'maker': this.parseNumber ('0.0005'),
                },
            },
            'precisionMode': TICK_SIZE,
            'exceptions': {
                'APIKEY_LOST': ArgumentsRequired,
                'SIGNATURE_LOST': ArgumentsRequired,
                'IP_NOT_WHITELISTED': InvalidAddress,
                'INVALIE_APIKEY': AuthenticationError,
                'INVALID_SIGNATURE': AuthenticationError,
                'APIKEY_EXPIRED': AuthenticationError,
                'INVALID_TIMESTAMP': BadRequest,
                'PERMISSION_DENIED': PermissionDenied,
                'TRADE_INVALID_SYMBOL': BadSymbol,
                'TRADE_PARAMETER_ERROR': BadRequest,
                'TRADE_NOT_ENOUGH_MONEY': InsufficientFunds,
                'TRADE_PRICE_FILTER_DENIED': BadRequest,
                'TRADE_SIZE_FILTER_DENIED': BadRequest,
                'TRADE_AMOUNT_FILTER_DENIED': BadRequest,
                'TRADE_REPEAT_CLIENT_ORDER_ID': DuplicateOrderId,
                'TRADE_OPEN_ORDER_EXCEED_LIMIT': DDoSProtection,
                'TRADE_OPERATION_DENIED': PermissionDenied,
                'TRADE_ORDER_NOT_FOUND': OrderNotFound,
            },
        });
    }

    async fetchMarkets (params = {}): Promise<Market[]> {
        /**
         * @method
         * @name pionex#fetchMarkets
         * @description retrieves data on all markets for pionex
         * @see https://pionex-doc.gitbook.io/apidocs/restful/common/market-data
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} an array of objects representing market data
         */
        const response = await this.publicGetCommonSymbols ();
        // {
        //   "data": {
        //     "symbols":[
        //       {
        //         "symbol": "BTC_USDT",
        //         "type": "SPOT",
        //         "baseCurrency": "BTC",
        //         "quoteCurrency": "USDT",
        //         "basePrecision": 6,
        //         "quotePrecision": 2,
        //         "amountPrecision": 8,
        //         "minAmount": "10",
        //         "minTradeSize": "0.000001",
        //         "maxTradeSize": "1000",
        //         "minTradeDumping": "0.000001",
        //         "maxTradeDumping": "100",
        //         "enable": true,
        //         "buyCeiling": "1.1",
        //         "sellFloor": "0.9"
        //       }
        //     ]
        //   },
        //   "result": true,
        //   "timestamp": 1566676132311
        // }
        const data = this.safeValue (response, 'data', {});
        const markets = this.safeValue (data, 'symbols', []);
        return this.parseMarkets (markets);
    }

    parseMarket (market: Dict): Market {
        //  {
        //    "symbol": "BTC_USDT",
        //    "type": "SPOT",
        //    "baseCurrency": "BTC",
        //    "quoteCurrency": "USDT",
        //    "basePrecision": 6,
        //    "quotePrecision": 2,
        //    "amountPrecision": 8,
        //    "minAmount": "10",
        //    "minTradeSize": "0.000001",
        //    "maxTradeSize": "1000",
        //    "minTradeDumping": "0.000001",
        //    "maxTradeDumping": "100",
        //    "enable": true,
        //    "buyCeiling": "1.1",
        //    "sellFloor": "0.9"
        //  }
        const baseId = this.safeString (market, 'baseCurrency');
        const quoteId = this.safeString (market, 'quoteCurrency');
        const type = this.safeStringLower (market, 'type');
        const spot = type === 'spot';
        return {
            'id': baseId + '/' + quoteId,
            'symbol': this.safeString (market, 'symbol'),
            'spot': spot,
            'type': type as MarketType,
            'base': baseId,
            'quote': quoteId,
            'baseId': baseId,
            'quoteId': quoteId,
            'active': this.safeBool (market, 'enable'),
            'maker': 0.0005,
            'taker': 0.0005,
            'limits': {
                'amount': {
                    'min': this.safeNumber (market, 'minTradeSize'),
                    'max': this.safeNumber (market, 'maxTradeSize'),
                },
            },
            'precision': {
                'amount': this.safeNumber (market, 'amountPrecision'),
                'price': this.safeNumber (market, 'basePrecision'),
                // 'qoute': this.safeNumber(market, 'quotePrecision'),
            },
            'info': market,
            'contract': false,
            'contractSize': undefined,
            'created': undefined,
            'expiry': undefined,
            'expiryDatetime': undefined,
            'future': !spot,
            'inverse': undefined,
            'linear': undefined,
            'margin': false,
            'swap': false,
            'option': false,
            'optionType': undefined,
            'settle': undefined,
            'settleId': undefined,
            'strike': undefined,
        };
    }

    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name pionex#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @see https://pionex-doc.gitbook.io/apidocs/restful/markets/get-trades
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Trade[]} a list of trades
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['symbol'],
        };
        if (limit !== undefined) {
            request['limit'] = Math.min (limit, 500); // default 100, max 500
        }
        const response = await this.publicGetMarketTrades (this.extend (request, params));
        // {
        //     "data": {
        //     "trades": [
        //         {
        //         "symbol": "BTC_USDT",
        //         "tradeId": "600848671",
        //         "price": "7962.62",
        //         "size": "0.0122",
        //         "side": "BUY",
        //         "timestamp": 1566691672311
        //     },
        //     {
        //         "symbol": "BTC_USDT",
        //         "tradeId": "600848670",
        //         "price": "7960.12",
        //         "size": "0.0198",
        //         "side": "BUY",
        //         "timestamp": 1566691672311
        //     }
        //     ]
        // },
        //     "result": true,
        //     "timestamp": 1566691672311
        // }
        const data = this.safeValue (response, 'data', {});
        const trades = this.safeValue (data, 'trades', []);
        return this.parseTrades (trades, market, since, limit);
    }

    parseTrade (trade: Dict, market: Market = undefined): Trade {
        // publicGetMarketTrades
        // {
        //     "symbol": "BTC_USDT",
        //     "tradeId": "600848670",
        //     "price": "7960.12",
        //     "size": "0.0198",
        //     "side": "BUY",
        //     "timestamp": 1566691672311
        // }
        //
        // privateGetTradeFills
        // {
        //     "id": 9876543210,
        //     "orderId": 22334455,
        //     "symbol": "BTC_USDT",
        //     "side": "BUY",
        //     "role":  "TAKER",
        //     "price": "30000.00",
        //     "size": "0.1000",
        //     "fee":  "0.15",
        //     "feeCoin":  "USDT",
        //     "timestamp": 1566676132311
        //   },
        const timestamp = this.safeInteger (trade, 'timestamp');
        return this.safeTrade ({
            'info': trade,
            'id': this.safeString2 (trade, 'tradeId', 'id'),
            'order': this.safeString (trade, 'orderId'),
            'symbol': this.safeString (trade, 'symbol'),
            'side': this.safeStringLower (trade, 'side'),
            'type': this.safeStringLower (trade, 'type'),
            'takerOrMaker': this.safeStringLower (trade, 'role'),
            'price': this.safeString (trade, 'price'),
            'amount': this.safeString (trade, 'size'),
            'cost': undefined,
            'fee': {
                'cost': this.safeString (trade, 'fee'),
                'currency': this.safeCurrencyCode (this.safeString (trade, 'feeCoin')),
                'rate': undefined,
            },
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
        }, market);
    }

    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        /**
         * @method
         * @name pionex#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @see https://pionex-doc.gitbook.io/apidocs/restful/markets/get-depth
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int} [limit] the maximum amount of order book entries to return
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} A dictionary of order book structures
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['symbol'],
        };
        if (limit !== undefined) {
            request['limit'] = Math.min (limit, 1000); // default 20, max 1000
        }
        const response = await this.publicGetMarketDepth (this.extend (request, params));
        // {
        // "data": {
        //     "bids": [
        //         ["29658.37", "0.0123"],
        //         ["29658.35", "1.1234"],
        //         ["29657.99", "2.2345"],
        //         ["29657.56", "6.3456"],
        //         ["29656.13", "8.4567"]
        //     ],
        //     "asks": [
        //         ["29658.47", "0.0345"],
        //         ["29658.65", "1.0456"],
        //         ["29658.89", "3.5567"],
        //         ["29659.43", "5.2678"],
        //         ["29659.98", "1.9789"]
        //     ]，
        //     "updateTime": 1566676132311
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const orderBook = this.safeDict (response, 'data');
        return this.parseOrderBook (orderBook, market['symbol'], undefined, 'bids', 'asks');
    }

    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        /**
         * @method
         * @name pionex#fetchOHLCV
         * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @see https://pionex-doc.gitbook.io/apidocs/restful/markets/get-klines
         * @param {string} symbol unified symbol of the market to fetch OHLCV data for
         * @param {string} timeframe the length of time each candle represents
         * @param {int} [since] timestamp in ms of the earliest candle to fetch
         * @param {int} [limit] the maximum amount of candles to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['symbol'],
        };
        if (timeframe !== undefined) {
            request['timeframe'] = this.timeframes[timeframe];
        }
        if (limit !== undefined) {
            request['limit'] = Math.min (limit, 500); // default 100, max 500
        }
        const response = await this.publicGetMarketKlines (this.extend (request, params));
        const data = this.safeDict (response, 'data', {});
        const klines = this.safeValue (data, 'klines', []);
        // {
        // "result": true,
        // "data": {
        //     "klines": [
        //     {
        //         "time": 1691649240000,
        //         "open": "1851.27",
        //         "close": "1851.32",
        //         "high": "1851.32",
        //         "low": "1851.27",
        //         "volume": "0.542"
        //     }
        //     ]
        // },
        // "timestamp": 1691649271544
        // }
        return this.parseOHLCVs (klines, market, timeframe, since, limit);
    }

    parseOHLCV (ohlcv, market: Market = undefined): OHLCV {
        // {
        //     "time": 1691649240000,
        //     "open": "1851.27",
        //     "close": "1851.32",
        //     "high": "1851.32",
        //     "low": "1851.27",
        //     "volume": "0.542"
        // }
        return [
            this.safeInteger (ohlcv, 'time'),  // timestamp
            this.safeNumber (ohlcv, 'open'),  // open
            this.safeNumber (ohlcv, 'high'),  // high
            this.safeNumber (ohlcv, 'low'),  // low
            this.safeNumber (ohlcv, 'close'),  // close
            this.safeNumber (ohlcv, 'volume'),  // volume
        ];
    }

    async fetchTickers (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        /**
         * @method
         * @name pionex#fetchTickers
         * @description fetches price tickers for multiple markets, statistical information calculated over the past 24 hours for each market
         * @see https://pionex-doc.gitbook.io/apidocs/restful/markets/get-24hr-ticker
         * @see https://pionex-doc.gitbook.io/apidocs/restful/markets/get-book-ticker
         * @param {string[]|undefined} symbols unified symbols of the markets to fetch the ticker for, all market tickers are returned if not assigned
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a dictionary of ticker structures]
         */
        await this.loadMarkets ();
        const request: Dict = {
            'type': 'SPOT',
        };
        const response = await this.publicGetMarketTickers (this.extend (request, params));
        // {
        // "data": {
        //     "tickers": [
        //     {
        //         "symbol": "BTC_USDT",
        //         "time": 1545291675000,
        //         "open": "7962.62",
        //         "close": "7952.32",
        //         "high": "7971.61",
        //         "low": "7950.29",
        //         "volume": "1.537",
        //         "amount": "12032.56",
        //         "count": 271585
        //     },
        //     {
        //         "symbol": "ETH_USDT",
        //         "time": 1545291675000,
        //         "open": "1963.62",
        //         "close": "1852.22",
        //         "high": "1971.11",
        //         "low": "1850.23",
        //         "volume": "100.532",
        //         "amount": "112012.51",
        //         "count": 432211
        //     }
        //     ]
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const response2 = await this.publicGetMarketBookTickers (this.extend (request, params));
        // {
        // "data": {
        //     "tickers": [
        //     ]
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const data = this.safeDict (response, 'data', {});
        const data2 = this.safeDict (response2, 'data', {});
        const tickers = this.safeList (data, 'tickers', []);
        const tickers2 = this.safeList (data2, 'tickers', []);
        const tickersFinal = [];
        const keys = this.keys (tickers);
        for (let i = 0; i < keys.length; i++) {
            const tk = keys[i];
            const ticker = tickers[tk];
            const keys2 = this.keys (tickers);
            for (let j = 0; j < keys2.length; j++) {
                const tk2 = keys[j];
                const ticker2 = tickers2[tk2];
                if (ticker2['symbol'] === ticker['symbol']) {
                    tickersFinal.push (this.extend (ticker, ticker2));
                }
            }
        }
        return this.parseTickers (tickersFinal, symbols);
    }

    parseTicker (ticker: Dict, market: Market = undefined): Ticker {
        // {
        //     "symbol": "ETH_USDT",
        //     "time": 1545291675000,
        //     "open": "1963.62",
        //     "close": "1852.22",
        //     "high": "1971.11",
        //     "low": "1850.23",
        //     "volume": "100.532",
        //     "amount": "112012.51",
        //     "count": 432211
        // }
        const timestamp = this.safeNumber (ticker, 'time');
        return this.safeTicker ({
            'symbol': this.safeString (ticker, 'symbol'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeNumber (ticker, 'high'),
            'low': this.safeNumber (ticker, 'low'),
            'open': this.safeNumber (ticker, 'open'),
            'close': this.safeNumber (ticker, 'close'),
            'baseVolume': this.safeNumber (ticker, 'volume'),
            'info': ticker,
            'bid': this.safeNumber (ticker, 'bidPrice'),
            'bidVolume': this.safeNumber (ticker, 'bidSize'),
            'ask': this.safeNumber (ticker, 'askPrice'),
            'askVolume': this.safeNumber (ticker, 'askSize'),
            'vwap': undefined,
            'last': this.safeString (ticker, 'last_price'),
            'previousClose': undefined,
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'quoteVolume': this.safeString (ticker, 'quote_volume'),
        }, market);
    }

    async fetchBalance (params = {}): Promise<Balances> {
        /**
         * @method
         * @name pionex#fetchBalance
         * @description query for balance and get the amount of funds available for trading or funds locked in orders
         * @see https://pionex-doc.gitbook.io/apidocs/restful/account/get-balance
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a balance structure
         */
        await this.loadMarkets ();
        const response = await this.privateGetAccountBalances (this.extend (params));
        // {
        // "data": {
        //     "balances": [
        //     {
        //         "coin": "BTC",
        //         "free": "0.9000000",
        //         "frozen": "0.00000000"
        //     },
        //     {
        //         "coin": "USDT",
        //         "free": "100.00000000",
        //         "frozen": "900.00000000"
        //     }
        //     ]
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        return this.parseBalance (response);
    }

    parseBalance (response): Balances {
        // {
        // "data": {
        //     "balances": [
        //     {
        //         "coin": "BTC",
        //         "free": "0.9000000",
        //         "frozen": "0.00000000"
        //     },
        //     {
        //         "coin": "USDT",
        //         "free": "100.00000000",
        //         "frozen": "900.00000000"
        //     }
        //     ]
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const data = this.safeDict (response, 'data', {});
        const balances = this.safeList (data, 'balances', []);
        const timestamp = this.safeString (response, 'timestamp');
        const result: Dict = {
            'info': balances,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
        };
        for (let i = 0; i < response.length; i++) {
            const balance = balances[i];
            const currencyId = this.safeString (balance, 'coin');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeString (balance, 'free');
            const frozen = this.safeNumber (balance, 'frozen');
            account['total'] = (+account['free'] + frozen).toString ();
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name latoken#fetchOrders
         * @description fetches information on multiple orders made by the user
         * @see https://pionex-doc.gitbook.io/apidocs/restful/orders/get-all-orders
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of order structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['symbol'],
        };
        if (limit === undefined) {
            limit = 50;  // max = 200
        } else {
            limit = Math.min (200, limit);
        }
        const response = this.privateGetTradeAllOrders (this.extend (request, params));
        // {
        // "data": {
        //    "orders":[
        //    {
        //        // "orderId": 1234567890,
        //        // "symbol": "BTC_USDT",
        //        // "type": "LIMIT",
        //        // "side": "SELL",
        //        // "price": "30000.00",
        //        // "size": "0.1000",
        //        // "filledSize": "0.0500",
        //        // "filledAmount": "1500.00",
        //        // "fee":  "0.15",
        //        // "feeCoin":  "USDT",
        //        // "status": "OPEN",
        //        // "IOC": false,
        //        // "clientOrderId":  "9e3d93d6-e9a4-465a-a39c-2e48568fe194",
        //        // "source": "API",
        //        // "createTime": 1566676132311,
        //        // "updateTime": 1566676132311
        //     }
        //    ]
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const data = this.safeDict (response, 'data', {});
        const orders = this.safeList (data, 'orders', []);
        return this.parseOrders (orders, market, since, limit);
    }

    async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name pionex#fetchOpenOrders
         * @description fetch all unfilled currently open orders
         * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#open-api---order-list
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of order structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOpenOrders() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['symbol'],
        };
        if (limit === undefined) {
            limit = 50;  // max = 200
        } else {
            limit = Math.min (200, limit);
        }
        const response = await this.privateGetTradeOpenOrders (this.extend (request, params));
        // {
        //     "data": {
        //       "orders":[
        //         {
        //           "orderId": 1234567890,
        //           "symbol": "BTC_USDT",
        //           "type": "LIMIT",
        //           "side": "SELL",
        //           "price": "30000.00",
        //           "size": "0.1000",
        //           "filledSize": "0.0500",
        //           "filledAmount": "1500.00",
        //           "fee":  "0.15",
        //           "feeCoin":  "USDT",
        //           "status": "OPEN",
        //           "IOC": false,
        //           "clientOrderId":  "9e3d93d6-e9a4-465a-a39c-2e48568fe194",
        //           "source": "API",
        //           "createTime": 1566676132311,
        //           "updateTime": 1566676132311
        //         }
        //       ]
        //     },
        //     "result": true,
        //     "timestamp": 1566676132311
        //   }
        const data = this.safeDict (response, 'data', {});
        const orders = this.safeList (data, 'orders', []);
        return this.parseOrders (orders, market, since, limit);
    }

    async fetchOrder (id: string, symbol: Str = undefined, params = {}) {
        /**
         * @method
         * @name pionex#fetchOrder
         * @description fetches information on an order made by the user
         * @see https://pionex-doc.gitbook.io/apidocs/restful/orders/get-order
         * @param {string} id the order id
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const clientOrderId = this.safeValue2 (params, 'client_order_id', 'clientOrderId');
        const request: Dict = {};
        let response: any;
        if (clientOrderId !== undefined) {
            request['clientOrderId'] = clientOrderId;
            params = this.omit (params, [ 'client_order_id', 'clientOrderId' ]);
            response = this.privateGetTradeOrderByClientOrderId (this.extend (request, params));
        } else {
            request['orderId'] = id;
            response = this.privateGetTradeOrder (this.extend (request, params));
        }
        // {
        // "data": {
        //     "orderId": 1234567890,
        //     "symbol": "BTC_USDT",
        //     "type": "LIMIT",
        //     "side": "SELL",
        //     "price": "30000.00",
        //     "size": "0.1000",
        //     "filledSize": "0.0500",
        //     "filledAmount": "1500.00",
        //     "fee":  "0.15",
        //     "feeCoin":  "USDT",
        //     "status": "OPEN",
        //     "IOC":  false,
        //     "clientOrderId":  "9e3d93d6-e9a4-465a-a39c-2e48568fe194",
        //     "source": "API",
        //     "createTime": 1566676132311,
        //     "updateTime": 1566676132311
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const data = this.safeDict (response, 'data', {});
        return this.parseOrder (data, undefined);
    }

    parseOrder (order: Dict, market: Market = undefined): Order {
        // {
        //     "orderId": 1234567890,
        //     "symbol": "BTC_USDT",
        //     "type": "LIMIT",
        //     "side": "SELL",
        //     "price": "30000.00",
        //     "size": "0.1000",
        //     "filledSize": "0.0500",
        //     "filledAmount": "1500.00",
        //     "fee":  "0.15",
        //     "feeCoin":  "USDT",
        //     "status": "OPEN",
        //     "IOC":  false,
        //     "clientOrderId":  "9e3d93d6-e9a4-465a-a39c-2e48568fe194",
        //     "source": "API",
        //     "createTime": 1566676132311,
        //     "updateTime": 1566676132311
        // }
        const timestamp = this.safeNumber (order, 'createTime');
        const size = this.safeNumber (order, 'size');
        const filledSize = this.safeNumber (order, 'filledSize');
        const side = this.safeStringLower (order, 'side');
        let remaining = size - filledSize;
        let average = 0;
        if (filledSize) {
            average = this.safeNumber (order, 'filledAmount') / filledSize;
        }
        if (side === 'buy') {
            remaining = filledSize - size;
        }
        return this.safeOrder ({
            'id': this.safeString (order, 'orderId'),
            'clientOrderId': this.safeString (order, 'clientOrderId'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': this.safeNumber (order, 'updateTime'),
            'status': this.safeStringLower (order, 'status'),
            'symbol': this.safeString (order, 'symbol'),
            'type': this.safeStringLower (order, 'type'),
            'timeInForce': undefined,
            'postOnly': this.safeBool (order, 'IOC'),
            'side': side,
            'price': this.safeNumber (order, 'price'),
            'stopPrice': undefined,
            'triggerPrice': this.safeNumber (order, 'price'),
            'amount': size,
            'filled': filledSize,
            'remaining': remaining,
            'cost': this.safeNumber (order, 'fee'),
            'trades': undefined,
            'average': average,
            'fee': {
                'currency': this.safeString (order, 'feeCoin'),
                'cost': this.safeString (order, 'fee'),
            },
            'info': order,
        }, market);
    }

    async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name pionex#fetchMyTrades
         * @description fetch all trades made by the user
         * @see https://pionex-doc.gitbook.io/apidocs/restful/orders/get-fills
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': symbol,
        };
        const response = this.privateGetTradeFills (this.extend (request, params));
        // {
        // "data": {
        //     "fills":[
        //     {
        //         "id": 9876543210,
        //         "orderId": 123456789,
        //         "symbol": "BTC_USDT",
        //         "side": "SELL",
        //         "role":  "TAKER",
        //         "price": "30000.00",
        //         "size": "0.1000",
        //         "fee":  "0.15",
        //         "feeCoin":  "USDT",
        //         "timestamp": 1566676132311
        //     },
        //     {
        //         "id": 9876543200,
        //         "orderId": 123456789,
        //         "symbol": "BTC_USDT",
        //         "side": "SELL",
        //         "role":  "TAKER",
        //         "price": "29000.00",
        //         "size": "0.1200",
        //         "fee":  "0.145",
        //         "feeCoin":  "USDT",
        //         "timestamp": 1566676132310
        //     }
        //     ]
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const data = this.safeDict (response, 'data', {});
        const fills = this.safeList (data, 'fills', []);
        return this.parseTrades (fills, market, since, limit);
    }

    async fetchOrderTrades (id: string, symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name pionex#fetchOrderTrades
         * @description fetch all the trades made from a single order
         * @see https://pionex-doc.gitbook.io/apidocs/restful/orders/get-fills-by-order-id
         * @param {string} id order id
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch trades for
         * @param {int} [limit] the maximum number of trades to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
         */
        await this.loadMarkets ();
        const market = this.safeMarket (symbol);
        const request: Dict = {
            'orderId': id,
        };
        const response = await this.privateGetTradeFillsByOrderId (this.extend (request, params));
        // {
        //     "data": {
        //       "fills":[
        //         {
        //           "id": 9876543210,
        //           "orderId": 22334455,
        //           "symbol": "BTC_USDT",
        //           "side": "BUY",
        //           "role":  "TAKER",
        //           "price": "30000.00",
        //           "size": "0.1000",
        //           "fee":  "0.15",
        //           "feeCoin":  "USDT",
        //           "timestamp": 1566676132311
        //         },
        //         {
        //           "id": 9876543200,
        //           "orderId": 22334455,
        //           "symbol": "BTC_USDT",
        //           "side": "BUY",
        //           "role":  "TAKER",
        //           "price": "29000.00",
        //           "size": "0.1200",
        //           "fee":  "0.145",
        //           "feeCoin":  "USDT",
        //           "timestamp": 1566676132310
        //         }
        //       ]
        //     },
        //     "result": true,
        //     "timestamp": 1566691672311
        //   }
        const data = this.safeDict (response, 'data');
        const fills = this.safeList (data, 'fills', []);
        return this.parseTrades (fills, market, since, limit);
    }

    async cancelOrder (id: string, symbol: Str = undefined, params = {}) {
        /**
         * @method
         * @name pionex#cancelOrder
         * @description cancels an open order
         * @see https://pionex-doc.gitbook.io/apidocs/restful/orders/cancel-order
         * @param {string} id order id
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['symbol'],
            'orderId': id,
        };
        this.privateDeleteTradeOrder (this.extend (request, params));
        // {
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const order = this.safeOrder ({ 'id': id, 'symbol': market['symbol'], 'info': {}}, market);
        return order;
    }

    async cancelAllOrders (symbol: Str = undefined, params = {}) {
        /**
         * @method
         * @name pionex#cancelAllOrders
         * @description cancel all open orders in a market
         * @see https://pionex-doc.gitbook.io/apidocs/restful/orders/cancel-all-orders
         * @param {string} symbol unified market symbol of the market to cancel orders in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': symbol,
        };
        this.privateDeleteTradeAllOrders (this.extend (request, params));
        //  {
        //  "result": true,
        //  "timestamp": 1566691672311
        //  }
        const order = this.safeOrder ({ 'symbol': market['symbol'], 'info': {}}, market);
        return [ order ];
    }

    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params = {}) {
        /**
         * @method
         * @name pionex#createOrder
         * @description create a trade order
         * @see https://pionex-doc.gitbook.io/apidocs/restful/orders/new-order
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much of currency you want to trade in units of base currency
         * @param {float} [price] the price at which the order is to be fulfilled, in units of the quote currency, ignored in market orders
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        this.loadMarkets ();
        const market = this.market (symbol);
        const clientOrderId = this.safeString2 (params, 'client_order_id', 'clientOrderId', this.uuid ());
        const request: Dict = {
            'symbol': market['symbol'],
            'side': side.toUpperCase (),
            'type': type.toUpperCase (),
            'amount': this.amountToPrecision (symbol, amount),
            'size': this.amountToPrecision (symbol, amount),
            'IOC': this.safeBool (params, 'postOnly', false),
            'clientOrderId': clientOrderId,
        };
        if (price) {
            request['price'] = price;
        }
        const response = this.privatePostTradeOrder (this.extend (request, params));
        // {
        //     "data": {
        //         "orderId": 1234567890,
        //         "clientOrderId":  "9e3d93d6-e9a4-465a-a39c-2e48568fe194"
        //     },
        //     "result": true,
        //     "timestamp": 1566691672311
        // }
        const data = this.safeDict (response, 'data', {});
        request['orderId'] = data['orderId'];
        return this.parseOrder (request, market);
    }

    async createOrders (orders: OrderRequest[], params = {}) {
        /**
         * @method
         * @name pionex#createOrders
         * @description create a list of trade orders
         * @see https://pionex-doc.gitbook.io/apidocs/restful/orders/new-multiple-order
         * @param {Array} orders list of orders to create, each object should contain the parameters required by createOrder, namely symbol, type, side, amount, price and params
         * @param {object} [params]  extra parameters specific to the exchange API endpoint
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const ordersRequests = [];
        for (let i = 0; i < orders.length; i++) {
            const rawOrder = orders[i];
            const symbol = this.safeString (rawOrder, 'symbol');
            const type = this.safeString (rawOrder, 'type');
            const side = this.safeStringUpper (rawOrder, 'side');
            const amount = this.safeNumber (rawOrder, 'amount');
            const price = this.safeNumber (rawOrder, 'price');
            const orderParams = this.safeDict (rawOrder, 'params', {});
            const orderRequest = this.createOrderRequest (symbol, type, side, amount, price, orderParams);
            ordersRequests.push (orderRequest);
        }
        const firstOrder = ordersRequests[0];
        const firstSymbol = this.safeString (firstOrder, 'symbol');
        const market = this.market (firstSymbol);
        const request: Dict = {
            'symbol': market[firstSymbol],
            'orders': ordersRequests,
        };
        const response = this.privatePostTradeMassOrder (this.extend (request, params));
        const data = this.safeDict (response, 'data', {});
        const orderIds = this.safeList (data, 'orderIds', []);
        const responseOrders = [];
        for (let i = 0; i < orderIds.length; i++) {
            const responseOrder = this.safeDict (orderIds, i, {});
            const orderRequests = this.safeDict (ordersRequests, i, {});
            orderRequests['orderId'] = responseOrder['orderId'];
            responseOrders.push (orderRequests);
        }
        return this.parseOrders (responseOrders);
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        const endpointPath = '/api/v1/' + this.implodeParams (path, params);
        let url = this.urls['api'][api] + endpointPath;
        params = this.omit (params, this.extractParams (path));
        if (params && method === 'GET' && api !== 'private') {
            url += '?' + this.urlencode (params);
        }
        if (api === 'private') {
            if (params && (method === 'POST' || method === 'DELETE')) {
                body = this.json (params);
            }
            params['timestamp'] = this.milliseconds ();
            url += '?' + this.urlencode (params);
            const sortedParams = this.keysort (params);
            let structedPath = method + endpointPath + '?' + this.urlencode (sortedParams);
            if (body) {
                structedPath = structedPath + body;
            }
            const signature = this.hmac (this.encode (structedPath), this.encode (this.secret), sha256);
            headers = {
                'Content-Type': 'application/json',
                'PIONEX-KEY': this.apiKey,
                'PIONEX-SIGNATURE': signature,
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code: int, reason: string, url: string, method: string, headers: Dict, body: string, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return undefined; // fallback to the default error handler
        }
        const feedback = this.id + ' ' + body;
        const status = this.safeNumber (response, 'status', 200);
        if (status > 200) {
            const statusStr = status.toString ();
            this.throwExactlyMatchedException (
                this.exceptions['exact'],
                statusStr,
                feedback
            );
            this.throwBroadlyMatchedException (
                this.exceptions['broad'],
                statusStr,
                feedback
            );
        }
        return undefined;
    }

    private createOrderRequest (symbol: Str, type: OrderType, side: OrderSide, amount: Num, price: Num = undefined, params = {}) {
        const market = this.market (symbol);
        const clientOrderId = this.safeString2 (params, 'client_order_id', 'clientOrderId', this.uuid ());
        params = this.omit (params, [ 'client_order_id', 'clientOrderId' ]);
        const request: Dict = {
            'clientOrderId': clientOrderId,
            'side': side,
            'symbol': market['symbol'],
            'type': 'LIMIT',  // Only support LIMIT.
            'size': this.amountToPrecision (symbol, amount),
            'price': price,
        };
        return this.extend (request, params);
    }
}

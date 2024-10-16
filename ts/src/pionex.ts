//  ---------------------------------------------------------------------------

import Exchange from './abstract/pionex.js';
import {
    BadRequest,
    AuthenticationError,
    InsufficientFunds,
    OrderNotFound,
    DDoSProtection,
    DuplicateOrderId,
    PermissionDenied,
    BadSymbol,
    InvalidAddress,
    ArgumentsRequired,
} from './base/errors.js';
import { Precise } from './base/Precise.js';
import { TICK_SIZE } from './base/functions/number.js';
import { sha256 } from './static_dependencies/noble-hashes/sha256.js';
import type {
    // Balances,
    Dict,
    Int,
    Market,
    MarketType,
    // Num,
    OHLCV,
    // Order,
    OrderBook,
    // OrderSide,
    // OrderType,
    Str,
    // Strings,
    // Ticker,
    // Tickers,
    Trade,
    int,
} from './base/types.js';

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
                'fetchTicker': true,
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
        const response = await this.publicGetTrades (this.extend (request, params));
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
        // {
        //     "symbol": "BTC_USDT",
        //     "tradeId": "600848670",
        //     "price": "7960.12",
        //     "size": "0.0198",
        //     "side": "BUY",
        //     "timestamp": 1566691672311
        // }
        const timestamp = this.safeInteger(trade, 'timestamp');
        return this.safeTrade ({
            'info': trade,
            'id': this.safeString(trade, 'id'),
            'order': undefined,
            'symbol': this.safeString(trade, 'symbol'),
            'side': this.safeStringLower(trade, 'side'),
            'type': this.safeStringLower(trade, 'type'),
            'takerOrMaker': undefined,
            'price': this.safeString(trade, 'price'),
            'amount': this.safeString(trade, 'size'),
            'cost': undefined,
            'fee': undefined,
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
        const response = await this.publicGetDepth (this.extend (request, params));
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
        const data = this.safeDict(response, 'data', {})
        const klines = this.safeValue(data, 'klines', [])
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
            this.safeInteger(ohlcv, 'time'),  // timestamp
            this.safeNumber(ohlcv, 'open'),  // open
            this.safeNumber(ohlcv, 'high'),  // high
            this.safeNumber(ohlcv, 'low'),  // low
            this.safeNumber(ohlcv, 'close'),  // close
            this.safeNumber(ohlcv, 'volume'),  // volume
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
            'type': 'SPOT'
        };

        const response = await this.publicGetTickers (this.extend (request, params));
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
        const response2 = await this.publicGetBookTickers (this.extend (request, params));
        // { 
        // "data": {
        //     "tickers": [
        //     ]
        // },
        // "result": true,
        // "timestamp": 1566691672311
        // }
        const data = this.safeDict(response, 'data', {});
        const data2 = this.safeDict(response2, 'data', {});
        const tickers = this.safeList(data, 'tickers', []);
        const tickers2 = this.safeList(data2, 'tickers', []);
        const tickersFinal: any = [];
        Object.keys(tickers).forEach(tk => {
            const ticker = tickers[tk];
            Object.keys(tickers2).forEach(tk2 => {
                const ticker2 = tickers2[tk2];
                if(ticker2['symbol'] === ticker['symbol']) {
                    tickersFinal.push(this.extend(ticker, ticker2));
                }
            });
        });
        return this.parseTickers(tickersFinal, symbols)
    }



    // parseTicker (ticker: Dict, market: Market = undefined): Ticker {
    //     //
    //     //     {
    //     //         "base_volume":229196.34035399999,
    //     //         "last_price":11881.06,
    //     //         "quote_volume":19.2909
    //     //     }
    //     //
    //     const marketId = this.safeString (ticker, 'id');
    //     const symbol = this.safeSymbol (marketId, market);
    //     return this.safeTicker ({
    //         'symbol': symbol,
    //         'timestamp': undefined,
    //         'datetime': undefined,
    //         'high': undefined,
    //         'low': undefined,
    //         'bid': undefined,
    //         'bidVolume': undefined,
    //         'ask': undefined,
    //         'askVolume': undefined,
    //         'vwap': undefined,
    //         'open': undefined,
    //         'close': this.safeString (ticker, 'last_price'),
    //         'last': this.safeString (ticker, 'last_price'),
    //         'previousClose': undefined,
    //         'change': undefined,
    //         'percentage': undefined,
    //         'average': undefined,
    //         'baseVolume': this.safeString (ticker, 'base_volume'),
    //         'quoteVolume': this.safeString (ticker, 'quote_volume'),
    //         'info': ticker,
    //     }, market);
    // }

    // async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
    //     /**
    //      * @method
    //      * @name pionex#fetchTicker
    //      * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
    //      * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#oapi-api---trade-data
    //      * @param {string} symbol unified symbol of the market to fetch the ticker for
    //      * @param {object} [params] extra parameters specific to the exchange API endpoint
    //      * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
    //      */
    //     await this.loadMarkets ();
    //     const market = this.market (symbol);
    //     const response = await this.publicGetOapiV2ListTradePrice (params);
    //     const marketId = market['id'] as string;
    //     const ticker = this.safeDict (response, marketId, {}) as Dict;
    //     //
    //     //     {
    //     //         "BTC/USDT":{
    //     //             "base_volume":229196.34035399999,
    //     //             "last_price":11881.06,
    //     //             "quote_volume":19.2909
    //     //         }
    //     //     }
    //     //
    //     return this.parseTicker (ticker, market);
    // }

    // parseOrderStatus (status: Str) {
    //     const statuses: Dict = {
    //         '0': 'open',
    //         '1': 'open',
    //         '2': 'closed',
    //         '4': 'canceled',
    //         '5': 'canceled',
    //     };
    //     return this.safeString (statuses, status, undefined);
    // }

    // parseOrder (order: Dict, market: Market = undefined): Order {
    //     //
    //     // createOrder
    //     //         "15697850529570392100421100482693"
    //     //
    //     // fetchOpenOrders
    //     //         {
    //     //             "uid": 0,
    //     //             "orderNo": "16113081376560890227301101413941",
    //     //             "orderTime": "2021-01-22 17:35:37",
    //     //             "orderTimeStamp": 1611308137656,
    //     //             "baseCurrencyId": 1,
    //     //             "baseCurrencyName": "TWD",
    //     //             "quoteCurrencyId": 14,
    //     //             "quoteCurrencyName": "USDT",
    //     //             "buyOrSell": "1",
    //     //             "num": "6.0000000000000000",
    //     //             "price": "32.5880000000000000",
    //     //             "remainNum": "2.0000000000000000",
    //     //             "tradeNum": "4.0000000000000000",
    //     //             "tradePrice": "31.19800000000000000000",
    //     //             "tradeAmount": "124.7920000000000000",
    //     //             "tradeRate": "0.66666666666666666667",
    //     //             "status": 1,
    //     //             "type": 1
    //     //         }
    //     //
    //     let id: Str;
    //     let timestamp: Int = undefined;
    //     let symbol: Str = undefined;
    //     let price: Str = undefined;
    //     let amount: Str = undefined;
    //     let side: Str = undefined;
    //     let type: Str = undefined;
    //     let status: Str = undefined;
    //     let filled: Str = undefined;
    //     let remaining: Str = undefined;
    //     let average: Str = undefined;
    //     if (typeof order === 'string') {
    //         id = order;
    //     } else {
    //         id = this.safeString (order, 'orderNo');
    //         timestamp = this.safeInteger (order, 'orderTimeStamp');
    //         if (timestamp === undefined) {
    //             const dateTime = this.safeString (order, 'orderTime');
    //             if (dateTime !== undefined) {
    //                 timestamp = this.parse8601 (dateTime);
    //                 timestamp = timestamp - 28800000; // 8 hours
    //             }
    //         }
    //         const orderSide = this.safeString (order, 'buyOrSell');
    //         if (orderSide !== undefined) {
    //             side = (orderSide === '1') ? 'buy' : 'sell';
    //         }
    //         amount = this.safeString (order, 'num');
    //         price = this.safeString (order, 'price');
    //         const quoteId = this.safeString (order, 'quoteCurrencyName');
    //         const baseId = this.safeString (order, 'baseCurrencyName');
    //         if (quoteId !== undefined && baseId !== undefined) {
    //             symbol = baseId + '/' + quoteId;
    //         }
    //         const orderType = this.safeString (order, 'type');
    //         if (orderType !== undefined) {
    //             type = (orderType === '1') ? 'limit' : 'market';
    //         }
    //         filled = this.safeString (order, 'tradeNum');
    //         remaining = this.safeString (order, 'remainNum');
    //         status = this.parseOrderStatus (this.safeString (order, 'status'));
    //         average = this.safeString (order, 'averagePrice');
    //     }
    //     return this.safeOrder ({
    //         'id': id,
    //         'clientOrderId': undefined,
    //         'timestamp': timestamp,
    //         'datetime': this.iso8601 (timestamp),
    //         'lastTradeTimestamp': undefined,
    //         'symbol': symbol,
    //         'type': type,
    //         'timeInForce': undefined,
    //         'postOnly': undefined,
    //         'side': side,
    //         'price': price,
    //         'stopPrice': undefined,
    //         'amount': amount,
    //         'cost': undefined,
    //         'average': average,
    //         'filled': filled,
    //         'remaining': remaining,
    //         'status': status,
    //         'fee': undefined,
    //         'trades': undefined,
    //         'info': order,
    //     }, market);
    // }

    // async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params = {}) {
    //     /**
    //      * @method
    //      * @name pionex#createOrder
    //      * @description create a trade order
    //      * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#open-api---new-order
    //      * @param {string} symbol unified symbol of the market to create an order in
    //      * @param {string} type 'market' or 'limit'
    //      * @param {string} side 'buy' or 'sell'
    //      * @param {float} amount how much of currency you want to trade in units of base currency
    //      * @param {float} [price] the price at which the order is to be fulfilled, in units of the quote currency, ignored in market orders
    //      * @param {object} [params] extra parameters specific to the exchange API endpoint
    //      * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
    //      */
    //     await this.loadMarkets ();
    //     const market = this.market (symbol);
    //     const orderType = type.toUpperCase ();
    //     const orderSide = side.toUpperCase ();
    //     const request: Dict = {
    //         'baseCurrencyId': market['baseId'],
    //         'quoteCurrencyId': market['quoteId'],
    //         'type': (orderType === 'LIMIT') ? 1 : 2,
    //         'buyOrSell': (orderSide === 'BUY') ? 1 : 2,
    //         'num': this.amountToPrecision (symbol, amount),
    //     };
    //     if (type === 'limit') {
    //         request['price'] = this.priceToPrecision (symbol, price);
    //     }
    //     const response = await this.privatePostV2OrderOrder (this.extend (request, params));
    //     //
    //     //     {
    //     //         "attachment": "15697850529570392100421100482693",
    //     //         "message": null,
    //     //         "parameters": null,
    //     //         "status": 200
    //     //     }
    //     //
    //     const data = this.safeDict (response, 'attachment');
    //     return this.parseOrder (data, market);
    // }

    // async cancelOrder (id: string, symbol: Str = undefined, params = {}) {
    //     /**
    //      * @method
    //      * @name pionex#cancelOrder
    //      * @description cancels an open order
    //      * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#open-api---cancel-order
    //      * @param {string} id order id
    //      * @param {string} symbol unified symbol of the market the order was made in
    //      * @param {object} [params] extra parameters specific to the exchange API endpoint
    //      * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
    //      */
    //     await this.loadMarkets ();
    //     const request: Dict = {
    //         'orderNo': id,
    //     };
    //     const response = await this.privatePostV2OrderCancel (this.extend (request, params));
    //     //
    //     //     {
    //     //         "attachment": 200,
    //     //         "message": null,
    //     //         "parameters": null,
    //     //         "status": 200
    //     //     }
    //     //
    //     return response;
    // }

    // async fetchOrder (id: string, symbol: Str = undefined, params = {}) {
    //     /**
    //      * @method
    //      * @name pionex#fetchOrder
    //      * @description fetches information on an order made by the user
    //      * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#open-api---order-status
    //      * @param {string} id the order id
    //      * @param {string} symbol unified symbol of the market the order was made in
    //      * @param {object} [params] extra parameters specific to the exchange API endpoint
    //      * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
    //      */
    //     await this.loadMarkets ();
    //     const request: Dict = {
    //         'orderNo': id,
    //     };
    //     const response = await this.privatePostV2OrderShowOrderStatus (this.extend (request, params));
    //     //
    //     //     {
    //     //         "attachment": {
    //     //             "buyOrSell": 1,
    //     //             "averagePrice": "490849.75000000",
    //     //             "num": "0.00000000",
    //     //             "orderTime": "2022-11-29 18:03:06.318",
    //     //             "price": "490849.75000000",
    //     //             "status": 4,
    //     //             "tradeNum": "0.02697000",
    //     //             "remainNum": "0.97303000",
    //     //             "baseCurrencyId": 2,
    //     //             "baseCurrencyName": "BTC",
    //     //             "quoteCurrencyId": 1,
    //     //             "quoteCurrencyName": "TWD",
    //     //             "orderNo": "16697161898600391472461100244406"
    //     //         },
    //     //         "message": null,
    //     //         "parameters": null,
    //     //         "status": 200
    //     //     }
    //     //
    //     const data = this.safeDict (response, 'attachment');
    //     return this.parseOrder (data, undefined);
    // }

    // async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
    //     /**
    //      * @method
    //      * @name pionex#fetchOpenOrders
    //      * @description fetch all unfilled currently open orders
    //      * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#open-api---order-list
    //      * @param {string} symbol unified market symbol of the market orders were made in
    //      * @param {int} [since] the earliest time in ms to fetch orders for
    //      * @param {int} [limit] the maximum number of order structures to retrieve
    //      * @param {object} [params] extra parameters specific to the exchange API endpoint
    //      * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
    //      */
    //     if (symbol === undefined) {
    //         throw new ArgumentsRequired (this.id + ' fetchOpenOrders() requires a symbol argument');
    //     }
    //     await this.loadMarkets ();
    //     const market = this.market (symbol);
    //     const request: Dict = {
    //         'quoteCurrencyId': market['quoteId'],
    //         'baseCurrencyId': market['baseId'],
    //         // 'start': 0,
    //     };
    //     if (limit !== undefined) {
    //         request['size'] = limit;
    //     }
    //     const response = await this.privatePostV2OrderGetOrderList (this.extend (request, params));
    //     const orders = this.safeList (response, 'attachment');
    //     //
    //     //     {
    //     //         "attachment": [
    //     //             {
    //     //                 "uid": 0,
    //     //                 "orderNo": "16113081376560890227301101413941",
    //     //                 "orderTime": "2021-01-22 17:35:37",
    //     //                 "orderTimeStamp": 1611308137656,
    //     //                 "baseCurrencyId": 1,
    //     //                 "baseCurrencyName": "TWD",
    //     //                 "quoteCurrencyId": 14,
    //     //                 "quoteCurrencyName": "USDT",
    //     //                 "buyOrSell": "1",
    //     //                 "num": "6.0000000000000000",
    //     //                 "price": "32.5880000000000000",
    //     //                 "remainNum": "2.0000000000000000",
    //     //                 "tradeNum": "4.0000000000000000",
    //     //                 "tradePrice": "31.19800000000000000000",
    //     //                 "tradeAmount": "124.7920000000000000",
    //     //                 "tradeRate": "0.66666666666666666667",
    //     //                 "status": 1,
    //     //                 "type": 1
    //     //             }
    //     //         ],
    //     //         "message": null,
    //     //         "parameters": null,
    //     //         "status": 200
    //     //     }
    //     //
    //     return this.parseOrders (orders, market, since, limit);
    // }

    // async fetchOrderTrades (id: string, symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
    //     /**
    //      * @method
    //      * @name pionex#fetchOrderTrades
    //      * @description fetch all the trades made from a single order
    //      * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#open-api---order-history
    //      * @param {string} id order id
    //      * @param {string} symbol unified market symbol
    //      * @param {int} [since] the earliest time in ms to fetch trades for
    //      * @param {int} [limit] the maximum number of trades to retrieve
    //      * @param {object} [params] extra parameters specific to the exchange API endpoint
    //      * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
    //      */
    //     await this.loadMarkets ();
    //     const market = this.safeMarket (symbol);
    //     const request: Dict = {
    //         'orderNo': id,
    //     };
    //     const response = await this.privatePostV2OrderShowOrderHistory (this.extend (request, params));
    //     //
    //     //     {
    //     //         "attachment": {
    //     //             "order": {
    //     //                 "buyOrSell": 1,
    //     //                 "averagePrice": "491343.74000000",
    //     //                 "num": "1.00000000",
    //     //                 "orderTime": "2022-11-29 18:32:22.232",
    //     //                 "price": "491343.74000000",
    //     //                 "status": 1,
    //     //                 "tradeNum": "0.01622200",
    //     //                 "remainNum": "0.98377800",
    //     //                 "baseCurrencyId": 2,
    //     //                 "baseCurrencyName": "BTC",
    //     //                 "quoteCurrencyId": 1,
    //     //                 "quoteCurrencyName": "TWD",
    //     //                 "orderNo": "16697179457740441472471100214402"
    //     //             },
    //     //             "trades": [
    //     //                 {
    //     //                     "price": "491343.74000000",
    //     //                     "num": "0.01622200",
    //     //                     "time": "2022-11-29 18:32:25.789",
    //     //                     "tradeNo": "16697179457897791471461000223437",
    //     //                     "amount": "7970.57815028"
    //     //                 }
    //     //             ]
    //     //         },
    //     //         "message": null,
    //     //         "parameters": null,
    //     //         "status": 200
    //     //     }
    //     //
    //     const data = this.safeDict (response, 'attachment');
    //     const trades = this.safeList (data, 'trades', []);
    //     return this.parseTrades (trades, market, since, limit);
    // }

    // async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
    //     /**
    //      * @method
    //      * @name pionex#fetchMyTrades
    //      * @description fetch all trades made by the user
    //      * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#open-api---trade-list
    //      * @param {string} symbol unified symbol of the market to fetch trades for
    //      * @param {int} [since] timestamp in ms of the earliest trade to fetch
    //      * @param {int} [limit] the maximum amount of trades to fetch
    //      * @param {object} [params] extra parameters specific to the exchange API endpoint
    //      * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
    //      */
    //     await this.loadMarkets ();
    //     const market = this.safeMarket (symbol);
    //     const request: Dict = {
    //         // 'buyOrSell': 1,
    //         // 'start': 0,
    //     };
    //     if (market['id'] !== undefined) {
    //         request['quoteCurrencyId'] = market['quoteId'];
    //         request['baseCurrencyId'] = market['baseId'];
    //     }
    //     if (limit !== undefined) {
    //         request['size'] = limit; // default 10, max 500
    //     }
    //     const response = await this.privatePostV2OrderGetTradeList (this.extend (request, params));
    //     //
    //     //     {
    //     //         "attachment": [
    //     //             {
    //     //                 "buyOrSell": 1,
    //     //                 "orderNo": "16708156853695560053601100247906",
    //     //                 "num": "1",
    //     //                 "price": "16895",
    //     //                 "orderAmount": "16895",
    //     //                 "tradeNum": "0.1",
    //     //                 "tradePrice": "16895",
    //     //                 "tradeAmount": "1689.5",
    //     //                 "fee": "0",
    //     //                 "feeSave": "0",
    //     //                 "status": 1,
    //     //                 "isSelf": false,
    //     //                 "tradeNo": "16708186395087940051961000274150",
    //     //                 "tradeTime": "2022-12-12 12:17:19",
    //     //                 "tradeTimestamp": 1670818639508,
    //     //                 "quoteCurrencyId": 14,
    //     //                 "quoteCurrencyName": "USDT",
    //     //                 "baseCurrencyId": 2,
    //     //                 "baseCurrencyName": "BTC"
    //     //             }
    //     //         ],
    //     //         "message": null,
    //     //         "parameters": null,
    //     //         "status": 200
    //     //     }
    //     //
    //     const trades = this.safeList (response, 'attachment', []);
    //     return this.parseTrades (trades, market, since, limit);
    // }

    // parseBalance (response): Balances {
    //     //
    //     //     [
    //     //         {
    //     //             "currencyId": 4,
    //     //             "amount": 6.896,
    //     //             "cashAmount": 6.3855,
    //     //             "uid": 123,
    //     //             "currencyName": "BTC"
    //     //         }
    //     //     ]
    //     //
    //     const result: Dict = {
    //         'info': response,
    //     };
    //     for (let i = 0; i < response.length; i++) {
    //         const balance = response[i];
    //         const currencyId = this.safeString (balance, 'currencyName');
    //         const code = this.safeCurrencyCode (currencyId);
    //         const amount = this.safeString (balance, 'amount');
    //         const available = this.safeString (balance, 'cashAmount');
    //         const account: Dict = {
    //             'free': available,
    //             'total': amount,
    //         };
    //         result[code] = account;
    //     }
    //     return this.safeBalance (result);
    // }

    // async fetchBalance (params = {}): Promise<Balances> {
    //     /**
    //      * @method
    //      * @name pionex#fetchBalance
    //      * @description query for balance and get the amount of funds available for trading or funds locked in orders
    //      * @see https://github.com/ace-exchange/ace-official-api-docs/blob/master/api_v2.md#open-api---account-balance
    //      * @param {object} [params] extra parameters specific to the exchange API endpoint
    //      * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
    //      */
    //     await this.loadMarkets ();
    //     const response = await this.privatePostV2CoinCustomerAccount (params);
    //     const balances = this.safeList (response, 'attachment', []);
    //     //
    //     //     {
    //     //         "attachment":[
    //     //             {
    //     //                 "currencyId": 4,
    //     //                 "amount": 6.896,
    //     //                 "cashAmount": 6.3855,
    //     //                 "uid": 123,
    //     //                 "currencyName": "BTC"
    //     //             }
    //     //         ],
    //     //         "message": null,
    //     //         "parameters": null,
    //     //         "status": "200"
    //     //     }
    //     //
    //     return this.parseBalance (balances);
    // }

    sign (
        path,
        api = 'public',
        method = 'GET',
        params = {},
        headers = undefined,
        body = undefined
    ) {
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
            const sortedParams = params;
            let structedPath = method + endpointPath + '?' + this.urlencode (sortedParams);
            if (body) {
                structedPath = structedPath + body;
            }
            const signature = this.hmac (
                this.encode (structedPath),
                this.encode (this.secret),
                sha256
            );
            headers = {
                'Content-Type': 'application/json',
                'PIONEX-KEY': this.apiKey,
                'PIONEX-SIGNATURE': signature,
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (
        code: int,
        reason: string,
        url: string,
        method: string,
        headers: Dict,
        body: string,
        response,
        requestHeaders,
        requestBody
    ) {
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
}

import { implicitReturnType } from '../base/types.js';
import { Exchange as _Exchange } from '../base/Exchange.js';
interface Exchange {
    publicGetCommonSymbols(params?: {}): Promise<implicitReturnType>;
    publicGetMarketTrades(params?: {}): Promise<implicitReturnType>;
    publicGetMarketDepth(params?: {}): Promise<implicitReturnType>;
    publicGetMarketTickers(params?: {}): Promise<implicitReturnType>;
    publicGetMarketBookTickers(params?: {}): Promise<implicitReturnType>;
    publicGetMarketKlines(params?: {}): Promise<implicitReturnType>;
    privateGetAccountBalances(params?: {}): Promise<implicitReturnType>;
    privateGetTradeOrder(params?: {}): Promise<implicitReturnType>;
    privateGetTradeOrderByClientOrderId(params?: {}): Promise<implicitReturnType>;
    privateGetTradeOpenOrders(params?: {}): Promise<implicitReturnType>;
    privateGetTradeAllOrders(params?: {}): Promise<implicitReturnType>;
    privateGetTradeFills(params?: {}): Promise<implicitReturnType>;
    privateGetTradeFillsByOrderId(params?: {}): Promise<implicitReturnType>;
    privatePostTradeOrder(params?: {}): Promise<implicitReturnType>;
    privatePostTradeMassOrder(params?: {}): Promise<implicitReturnType>;
    privateDeleteTradeOrder(params?: {}): Promise<implicitReturnType>;
    privateDeleteTradeAllOrders(params?: {}): Promise<implicitReturnType>;
}
declare abstract class Exchange extends _Exchange {
}
export default Exchange;

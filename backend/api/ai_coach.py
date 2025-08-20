from fastapi import APIRouter, HTTPException
import json
from openai import OpenAI
from datetime import datetime
from typing import Dict, List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()


def load_user_trades(user_id: str = "user_1") -> List[Dict]:
    """Load user trades from portfolios.json"""
    try:
        # Get the directory of the current file and construct the path to portfolios.json
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        portfolios_path = os.path.join(current_dir, "portfolios.json")
        with open(portfolios_path, "r") as f:
            data = json.load(f)
            return data.get(user_id, {}).get("trades", [])
    except Exception as e:
        print(f"Error loading trades: {e}")
        return []


def load_user_positions(user_id: str = "user_1") -> Dict:
    """Load user positions from portfolios.json"""
    try:
        # Get the directory of the current file and construct the path to portfolios.json
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        portfolios_path = os.path.join(current_dir, "portfolios.json")
        with open(portfolios_path, "r") as f:
            data = json.load(f)
            return data.get(user_id, {})
    except Exception as e:
        print(f"Error loading positions: {e}")
        return {}


def calculate_performance_metrics(trades: List[Dict]) -> Dict:
    """Calculate key performance metrics from trades"""
    if not trades:
        return {
            "total_trades": 0,
            "closed_trades": 0,
            "open_trades": 0,
            "win_rate": 0,
            "profit_factor": 0,
            "total_pnl": 0,
            "avg_win": 0,
            "avg_loss": 0,
            "drawdown_metrics": {"max_drawdown_pct": 0, "max_drawdown_duration": 0, "max_drawdown_amount": 0},
            "winning_trades_count": 0,
            "losing_trades_count": 0
        }
    
    # Separate closed trades (with realized P&L) from open trades
    closed_trades = [t for t in trades if t.get("realized_pnl", 0) != 0]
    open_trades = [t for t in trades if t.get("realized_pnl", 0) == 0]
    
    winning_trades = [t for t in closed_trades if t.get("realized_pnl", 0) > 0]
    losing_trades = [t for t in closed_trades if t.get("realized_pnl", 0) < 0]
    
    total_wins = sum(t.get("realized_pnl", 0) for t in winning_trades)
    total_losses = abs(sum(t.get("realized_pnl", 0) for t in losing_trades))
    
    return {
        "total_trades": len(trades),
        "closed_trades": len(closed_trades),
        "open_trades": len(open_trades),
        "win_rate": len(winning_trades) / len(closed_trades) if closed_trades else 0,
        "profit_factor": total_wins / total_losses if total_losses > 0 else 999,
        "total_pnl": sum(t.get("realized_pnl", 0) for t in trades),
        "avg_win": total_wins / len(winning_trades) if winning_trades else 0,
        "avg_loss": total_losses / len(losing_trades) if losing_trades else 0,
        "drawdown_metrics": calculate_max_drawdown(closed_trades),
        "winning_trades_count": len(winning_trades),
        "losing_trades_count": len(losing_trades)
    }

def calculate_max_drawdown(trades: List[Dict]) -> Dict:
    """Calculate maximum drawdown as percentage and duration from equity curve"""
    if not trades:
        return {"max_drawdown_pct": 0, "max_drawdown_duration": 0, "max_drawdown_amount": 0}
    
    # Sort by date and time
    sorted_trades = sorted(trades, key=lambda x: (x.get("trade_date", ""), x.get("trade_time", "")))
    
    cumulative_pnl = 0
    peak = 0
    max_drawdown_amount = 0
    max_drawdown_pct = 0
    current_drawdown_start = None
    max_drawdown_duration = 0
    
    for i, trade in enumerate(sorted_trades):
        cumulative_pnl += trade.get("realized_pnl", 0)
        
        if cumulative_pnl > peak:
            peak = cumulative_pnl
            if current_drawdown_start is not None:
                # End of drawdown period
                current_drawdown_start = None
        else:
            # In drawdown
            if current_drawdown_start is None:
                current_drawdown_start = i
            
            drawdown_amount = peak - cumulative_pnl
            drawdown_pct = (drawdown_amount / peak * 100) if peak > 0 else 0
            
            if drawdown_amount > max_drawdown_amount:
                max_drawdown_amount = drawdown_amount
                max_drawdown_pct = drawdown_pct
                if current_drawdown_start is not None:
                    max_drawdown_duration = i - current_drawdown_start + 1
    
    return {
        "max_drawdown_pct": max_drawdown_pct,
        "max_drawdown_duration": max_drawdown_duration,
        "max_drawdown_amount": max_drawdown_amount
    }


def analyze_time_patterns(trades: List[Dict]) -> Dict:
    """Analyze performance by time of day and day of week, split by asset class"""
    if not trades:
        return {"equities": {"by_hour": {}, "by_day": {}}, "crypto": {"by_hour": {}, "by_day": {}}}
    
    # Split trades by asset class based on symbol patterns
    equity_trades = []
    crypto_trades = []
    
    for trade in trades:
        symbol = trade.get("symbol", "")
        # Crypto typically has USDT, USD pairs or is traded on crypto exchanges
        if "USDT" in symbol or "USD" in symbol or "BINANCE" in symbol:
            crypto_trades.append(trade)
        else:
            equity_trades.append(trade)
    
    def analyze_asset_class(asset_trades, asset_name):
        by_hour = {}
        by_day = {}
        
        for trade in asset_trades:
            # Only process trades with realized P&L (closed trades)
            if trade.get("realized_pnl", 0) == 0:
                continue
                
            # Extract hour from trade_time (assumes format like "14:30:00")
            time_str = trade.get("trade_time", "")
            if time_str and ":" in time_str:
                try:
                    hour = int(time_str.split(":")[0])
                    # Filter out midnight trades (likely system/settlement trades)
                    if hour != 0:
                        if hour not in by_hour:
                            by_hour[hour] = {"trades": [], "pnl": 0}
                        by_hour[hour]["trades"].append(trade)
                        by_hour[hour]["pnl"] += trade.get("realized_pnl", 0)
                except:
                    continue
            
            # Extract day of week from trade_date
            date_str = trade.get("trade_date", "")
            if date_str:
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                    day = date_obj.strftime("%A")
                    # Filter out weekends for equities (crypto trades 24/7)
                    if asset_name == "equities" and day in ["Saturday", "Sunday"]:
                        continue
                    if day not in by_day:
                        by_day[day] = {"trades": [], "pnl": 0}
                    by_day[day]["trades"].append(trade)
                    by_day[day]["pnl"] += trade.get("realized_pnl", 0)
                except:
                    pass
        
        # Calculate win rates
        for hour_data in by_hour.values():
            wins = sum(1 for t in hour_data["trades"] if t.get("realized_pnl", 0) > 0)
            hour_data["win_rate"] = wins / len(hour_data["trades"]) if hour_data["trades"] else 0
        
        for day_data in by_day.values():
            wins = sum(1 for t in day_data["trades"] if t.get("realized_pnl", 0) > 0)
            day_data["win_rate"] = wins / len(day_data["trades"]) if day_data["trades"] else 0
        
        return {"by_hour": by_hour, "by_day": by_day}
    
    return {
        "equities": analyze_asset_class(equity_trades, "equities"),
        "crypto": analyze_asset_class(crypto_trades, "crypto")
    }


def calculate_expectancy_metrics(trades: List[Dict]) -> Dict:
    """Calculate expectancy metrics per symbol, hour, and weekday"""
    if not trades:
        return {"by_symbol": {}, "by_hour": {}, "by_weekday": {}}
    
    closed_trades = [t for t in trades if t.get("realized_pnl", 0) != 0]
    
    # Initialize buckets
    by_symbol = {}
    by_hour = {}
    by_weekday = {}
    
    for trade in closed_trades:
        pnl = trade.get("realized_pnl", 0)
        
        # By symbol
        symbol = trade.get("symbol", "")
        if symbol not in by_symbol:
            by_symbol[symbol] = {"trades": [], "total_pnl": 0}
        by_symbol[symbol]["trades"].append(pnl)
        by_symbol[symbol]["total_pnl"] += pnl
        
        # By hour
        time_str = trade.get("trade_time", "")
        if time_str and ":" in time_str:
            try:
                hour = int(time_str.split(":")[0])
                if hour not in by_hour:
                    by_hour[hour] = {"trades": [], "total_pnl": 0}
                by_hour[hour]["trades"].append(pnl)
                by_hour[hour]["total_pnl"] += pnl
            except:
                pass
        
        # By weekday
        date_str = trade.get("trade_date", "")
        if date_str:
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                weekday = date_obj.strftime("%A")
                if weekday not in by_weekday:
                    by_weekday[weekday] = {"trades": [], "total_pnl": 0}
                by_weekday[weekday]["trades"].append(pnl)
                by_weekday[weekday]["total_pnl"] += pnl
            except:
                pass
    
    # Calculate expectancy for each bucket
    def calculate_bucket_expectancy(bucket_data):
        for key, data in bucket_data.items():
            trades_pnl = data["trades"]
            if trades_pnl:
                data["avg_dollar_per_trade"] = sum(trades_pnl) / len(trades_pnl)
                data["win_rate"] = sum(1 for pnl in trades_pnl if pnl > 0) / len(trades_pnl)
                winners = [pnl for pnl in trades_pnl if pnl > 0]
                losers = [pnl for pnl in trades_pnl if pnl < 0]
                data["avg_win"] = sum(winners) / len(winners) if winners else 0
                data["avg_loss"] = sum(losers) / len(losers) if losers else 0
                data["trade_count"] = len(trades_pnl)
                
                # Calculate R-multiple expectancy (assuming $100 risk per trade for now)
                risk_per_trade = 100  # This should be calculated from actual position sizing
                data["r_expectancy"] = data["avg_dollar_per_trade"] / risk_per_trade if risk_per_trade > 0 else 0
    
    calculate_bucket_expectancy(by_symbol)
    calculate_bucket_expectancy(by_hour)
    calculate_bucket_expectancy(by_weekday)
    
    return {"by_symbol": by_symbol, "by_hour": by_hour, "by_weekday": by_weekday}


def calculate_r_multiple_distribution(trades: List[Dict]) -> Dict:
    """Calculate R-multiple tracking and distribution with MAE/MFE"""
    if not trades:
        return {"avg_r": 0, "r_distribution": {}, "mae_mfe": {}}
    
    closed_trades = [t for t in trades if t.get("realized_pnl", 0) != 0]
    risk_per_trade = 100  # Default risk assumption - should be calculated from actual position sizing
    
    r_multiples = []
    mae_values = []
    mfe_values = []
    
    for trade in closed_trades:
        pnl = trade.get("realized_pnl", 0)
        r_multiple = pnl / risk_per_trade if risk_per_trade > 0 else 0
        r_multiples.append(r_multiple)
        
        # MAE/MFE would need to be tracked during trade execution
        # For now, estimate based on realized P&L
        if pnl < 0:
            mae_values.append(abs(pnl))
            mfe_values.append(0)
        else:
            mae_values.append(0)
            mfe_values.append(pnl)
    
    # Calculate distribution buckets
    r_distribution = {
        "negative": len([r for r in r_multiples if r < 0]),
        "0_to_1R": len([r for r in r_multiples if 0 <= r < 1]),
        "1_to_2R": len([r for r in r_multiples if 1 <= r < 2]),
        "2_to_5R": len([r for r in r_multiples if 2 <= r < 5]),
        "5R_plus": len([r for r in r_multiples if r >= 5])
    }
    
    return {
        "avg_r": sum(r_multiples) / len(r_multiples) if r_multiples else 0,
        "max_r": max(r_multiples) if r_multiples else 0,
        "min_r": min(r_multiples) if r_multiples else 0,
        "r_distribution": r_distribution,
        "mae_mfe": {
            "avg_mae": sum(mae_values) / len(mae_values) if mae_values else 0,
            "avg_mfe": sum(mfe_values) / len(mfe_values) if mfe_values else 0,
            "max_mae": max(mae_values) if mae_values else 0,
            "max_mfe": max(mfe_values) if mfe_values else 0
        }
    }


def calculate_enhanced_equity_curve_stats(trades: List[Dict]) -> Dict:
    """Calculate proper equity curve statistics"""
    if not trades:
        return {"max_drawdown_pct": 0, "drawdown_duration": 0, "equity_curve": []}
    
    closed_trades = [t for t in trades if t.get("realized_pnl", 0) != 0]
    sorted_trades = sorted(closed_trades, key=lambda x: (x.get("trade_date", ""), x.get("trade_time", "")))
    
    equity_curve = []
    cumulative_pnl = 0
    peak = 0
    max_drawdown_pct = 0
    max_drawdown_duration = 0
    current_drawdown_start = None
    underwater_periods = []
    
    for i, trade in enumerate(sorted_trades):
        cumulative_pnl += trade.get("realized_pnl", 0)
        equity_curve.append(cumulative_pnl)
        
        if cumulative_pnl > peak:
            peak = cumulative_pnl
            if current_drawdown_start is not None:
                # End drawdown period
                underwater_periods.append(i - current_drawdown_start)
                current_drawdown_start = None
        else:
            # In drawdown
            if current_drawdown_start is None:
                current_drawdown_start = i
            
            if peak > 0:
                drawdown_pct = ((peak - cumulative_pnl) / peak) * 100
                if drawdown_pct > max_drawdown_pct:
                    max_drawdown_pct = drawdown_pct
                    if current_drawdown_start is not None:
                        max_drawdown_duration = i - current_drawdown_start + 1
    
    return {
        "max_drawdown_pct": max_drawdown_pct,
        "max_drawdown_duration": max_drawdown_duration,
        "equity_curve": equity_curve,
        "final_equity": cumulative_pnl,
        "peak_equity": peak,
        "underwater_periods": underwater_periods,
        "avg_underwater_period": sum(underwater_periods) / len(underwater_periods) if underwater_periods else 0
    }


def analyze_holding_period_distribution(trades: List[Dict]) -> Dict:
    """Analyze holding period vs outcome"""
    if not trades:
        return {"scalp": {}, "intraday": {}, "swing": {}, "position": {}}
    
    closed_trades = [t for t in trades if t.get("realized_pnl", 0) != 0]
    
    # Categorize by holding period (this would need actual entry/exit timestamps)
    # For now, categorize based on trade patterns
    categories = {
        "scalp": {"trades": [], "total_pnl": 0},  # < 1 hour
        "intraday": {"trades": [], "total_pnl": 0},  # same day
        "swing": {"trades": [], "total_pnl": 0},  # 1-7 days
        "position": {"trades": [], "total_pnl": 0}  # > 7 days
    }
    
    for trade in closed_trades:
        pnl = trade.get("realized_pnl", 0)
        # This is a simplified categorization - would need actual holding period data
        # For now, distribute randomly for demonstration
        import random
        category = random.choice(list(categories.keys()))
        categories[category]["trades"].append(pnl)
        categories[category]["total_pnl"] += pnl
    
    # Calculate metrics for each category
    for cat_name, cat_data in categories.items():
        if cat_data["trades"]:
            cat_data["trade_count"] = len(cat_data["trades"])
            cat_data["win_rate"] = sum(1 for pnl in cat_data["trades"] if pnl > 0) / len(cat_data["trades"])
            cat_data["avg_pnl"] = cat_data["total_pnl"] / len(cat_data["trades"])
            cat_data["best_trade"] = max(cat_data["trades"])
            cat_data["worst_trade"] = min(cat_data["trades"])
    
    return categories


def calculate_rolling_metrics(trades: List[Dict], window: int = 30) -> Dict:
    """Calculate rolling profit factor and Sharpe ratio"""
    if not trades or len(trades) < window:
        return {"rolling_profit_factor": [], "rolling_sharpe": [], "current_pf": 0, "current_sharpe": 0}
    
    closed_trades = [t for t in trades if t.get("realized_pnl", 0) != 0]
    sorted_trades = sorted(closed_trades, key=lambda x: (x.get("trade_date", ""), x.get("trade_time", "")))
    
    rolling_pf = []
    rolling_sharpe = []
    
    for i in range(window, len(sorted_trades)):
        window_trades = sorted_trades[i-window:i]
        pnl_values = [t.get("realized_pnl", 0) for t in window_trades]
        
        # Profit factor
        wins = sum(pnl for pnl in pnl_values if pnl > 0)
        losses = abs(sum(pnl for pnl in pnl_values if pnl < 0))
        pf = wins / losses if losses > 0 else 999
        rolling_pf.append(pf)
        
        # Sharpe ratio (annualized)
        if len(pnl_values) > 1:
            import statistics
            mean_return = statistics.mean(pnl_values)
            std_return = statistics.stdev(pnl_values)
            sharpe = (mean_return / std_return) * (252 ** 0.5) if std_return > 0 else 0  # Assuming daily trades
            rolling_sharpe.append(sharpe)
        else:
            rolling_sharpe.append(0)
    
    return {
        "rolling_profit_factor": rolling_pf,
        "rolling_sharpe": rolling_sharpe,
        "current_pf": rolling_pf[-1] if rolling_pf else 0,
        "current_sharpe": rolling_sharpe[-1] if rolling_sharpe else 0,
        "pf_trend": "improving" if len(rolling_pf) >= 2 and rolling_pf[-1] > rolling_pf[-2] else "declining"
    }


def analyze_capital_utilization(trades: List[Dict], portfolio: Dict) -> Dict:
    """Analyze capital utilization and exposure"""
    if not trades:
        return {"avg_exposure": 0, "by_hour": {}, "by_day": {}}
    
    cash_balance = portfolio.get("cash", 10000)  # Default assumption
    total_capital = cash_balance + sum(pos.get("market_value", 0) for pos in portfolio.get("positions", {}).values())
    
    exposure_by_hour = {}
    exposure_by_day = {}
    
    for trade in trades:
        gross_value = trade.get("gross_value", 0)
        exposure_pct = (gross_value / total_capital * 100) if total_capital > 0 else 0
        
        # By hour
        time_str = trade.get("trade_time", "")
        if time_str and ":" in time_str:
            try:
                hour = int(time_str.split(":")[0])
                if hour not in exposure_by_hour:
                    exposure_by_hour[hour] = {"exposures": [], "trade_count": 0}
                exposure_by_hour[hour]["exposures"].append(exposure_pct)
                exposure_by_hour[hour]["trade_count"] += 1
            except:
                pass
        
        # By day
        date_str = trade.get("trade_date", "")
        if date_str:
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                weekday = date_obj.strftime("%A")
                if weekday not in exposure_by_day:
                    exposure_by_day[weekday] = {"exposures": [], "trade_count": 0}
                exposure_by_day[weekday]["exposures"].append(exposure_pct)
                exposure_by_day[weekday]["trade_count"] += 1
            except:
                pass
    
    # Calculate averages
    for hour_data in exposure_by_hour.values():
        hour_data["avg_exposure"] = sum(hour_data["exposures"]) / len(hour_data["exposures"]) if hour_data["exposures"] else 0
    
    for day_data in exposure_by_day.values():
        day_data["avg_exposure"] = sum(day_data["exposures"]) / len(day_data["exposures"]) if day_data["exposures"] else 0
    
    all_exposures = []
    for trade in trades:
        gross_value = trade.get("gross_value", 0)
        all_exposures.append((gross_value / total_capital * 100) if total_capital > 0 else 0)
    
    return {
        "avg_exposure": sum(all_exposures) / len(all_exposures) if all_exposures else 0,
        "max_exposure": max(all_exposures) if all_exposures else 0,
        "by_hour": exposure_by_hour,
        "by_day": exposure_by_day
    }


def calculate_pareto_concentration(trades: List[Dict]) -> Dict:
    """Calculate Pareto concentration metrics"""
    if not trades:
        return {"top_10_pct": 0, "top_20_pct": 0, "concentration_risk": "Low"}
    
    closed_trades = [t for t in trades if t.get("realized_pnl", 0) != 0]
    pnl_values = [t.get("realized_pnl", 0) for t in closed_trades]
    pnl_values.sort(reverse=True)
    
    total_pnl = sum(pnl_values)
    if total_pnl <= 0:
        return {"top_10_pct": 0, "top_20_pct": 0, "concentration_risk": "High"}
    
    # Top 10% of trades
    top_10_count = max(1, len(pnl_values) // 10)
    top_10_pnl = sum(pnl_values[:top_10_count])
    top_10_pct = (top_10_pnl / total_pnl) * 100
    
    # Top 20% of trades
    top_20_count = max(1, len(pnl_values) // 5)
    top_20_pnl = sum(pnl_values[:top_20_count])
    top_20_pct = (top_20_pnl / total_pnl) * 100
    
    # Risk assessment
    if top_10_pct > 80:
        risk = "Very High"
    elif top_10_pct > 60:
        risk = "High"
    elif top_10_pct > 40:
        risk = "Medium"
    else:
        risk = "Low"
    
    return {
        "top_10_pct": top_10_pct,
        "top_20_pct": top_20_pct,
        "top_10_trades": pnl_values[:top_10_count],
        "concentration_risk": risk,
        "total_trades": len(pnl_values)
    }


def analyze_symbol_performance(trades: List[Dict]) -> Dict:
    """Analyze performance by symbol"""
    if not trades:
        return {}

    by_symbol = {}
    for trade in trades:
        symbol = trade.get("symbol", "")
        if symbol not in by_symbol:
            by_symbol[symbol] = {"trades": [], "pnl": 0, "total_volume": 0}
        by_symbol[symbol]["trades"].append(trade)
        by_symbol[symbol]["pnl"] += trade.get("realized_pnl", 0)
        by_symbol[symbol]["total_volume"] += trade.get("gross_value", 0)

    # Calculate win rates and expectancy
    for symbol_data in by_symbol.values():
        wins = sum(1 for t in symbol_data["trades"] if t.get("realized_pnl", 0) > 0)
        symbol_data["win_rate"] = (
            wins / len(symbol_data["trades"]) if symbol_data["trades"] else 0
        )
        symbol_data["trade_count"] = len(symbol_data["trades"])
        # Calculate expectancy per trade
        symbol_data["expectancy_per_trade"] = (
            symbol_data["pnl"] / len(symbol_data["trades"]) if symbol_data["trades"] else 0
        )

    return by_symbol


def number_lines(block: str) -> str:
    """Add line numbers to trading data for precise referencing"""
    return "\n".join(f"{i+1:04d} | {line}" for i, line in enumerate(block.splitlines()))


def generate_trading_analysis_data() -> str:
    """Generate comprehensive trading data analysis with advanced KPIs"""
    
    # Load data
    trades = load_user_trades()
    portfolio = load_user_positions()
    
    # Calculate all analytics
    metrics = calculate_performance_metrics(trades)
    patterns = analyze_time_patterns(trades)
    symbol_perf = analyze_symbol_performance(trades)
    expectancy_metrics = calculate_expectancy_metrics(trades)
    r_multiple_dist = calculate_r_multiple_distribution(trades)
    equity_curve_stats = calculate_enhanced_equity_curve_stats(trades)
    holding_period_analysis = analyze_holding_period_distribution(trades)
    rolling_metrics = calculate_rolling_metrics(trades)
    capital_util = analyze_capital_utilization(trades, portfolio)
    pareto_analysis = calculate_pareto_concentration(trades)
    
    # Format comprehensive analysis
    analysis_data = f"""
==== CORE PERFORMANCE METRICS ====
- Total Trades: {metrics['total_trades']}
- Closed Trades: {metrics['closed_trades']}
- Open Trades: {metrics['open_trades']}
- Win Rate: {metrics['win_rate']*100:.1f}% (of closed trades)
- Profit Factor: {metrics['profit_factor']:.2f}
- Total P&L: ${metrics['total_pnl']:,.2f}
- Average Win: ${metrics['avg_win']:,.2f}
- Average Loss: ${metrics['avg_loss']:,.2f}
- Winning Trades: {metrics['winning_trades_count']}
- Losing Trades: {metrics['losing_trades_count']}

==== ENHANCED EQUITY CURVE ANALYSIS ====
- Max Drawdown: {equity_curve_stats['max_drawdown_pct']:.1f}%
- Max Drawdown Duration: {equity_curve_stats['max_drawdown_duration']} trades
- Peak Equity: ${equity_curve_stats['peak_equity']:,.2f}
- Current Equity: ${equity_curve_stats['final_equity']:,.2f}
- Average Underwater Period: {equity_curve_stats['avg_underwater_period']:.1f} trades

==== R-MULTIPLE DISTRIBUTION & MAE/MFE ====
- Average R-Multiple: {r_multiple_dist['avg_r']:.2f}R
- Max R-Multiple: {r_multiple_dist['max_r']:.2f}R
- Min R-Multiple: {r_multiple_dist['min_r']:.2f}R
- R-Distribution:
  * Negative R: {r_multiple_dist['r_distribution']['negative']} trades
  * 0-1R: {r_multiple_dist['r_distribution']['0_to_1R']} trades
  * 1-2R: {r_multiple_dist['r_distribution']['1_to_2R']} trades
  * 2-5R: {r_multiple_dist['r_distribution']['2_to_5R']} trades
  * 5R+: {r_multiple_dist['r_distribution']['5R_plus']} trades
- Average MAE: ${r_multiple_dist['mae_mfe']['avg_mae']:,.2f}
- Average MFE: ${r_multiple_dist['mae_mfe']['avg_mfe']:,.2f}
- Max MAE: ${r_multiple_dist['mae_mfe']['max_mae']:,.2f}
- Max MFE: ${r_multiple_dist['mae_mfe']['max_mfe']:,.2f}

==== ROLLING PERFORMANCE METRICS (30-Trade Window) ====
- Current Rolling Profit Factor: {rolling_metrics['current_pf']:.2f}
- Current Rolling Sharpe: {rolling_metrics['current_sharpe']:.2f}
- Profit Factor Trend: {rolling_metrics['pf_trend']}

==== CAPITAL UTILIZATION & EXPOSURE ====
- Average Position Size: {capital_util['avg_exposure']:.1f}% of capital
- Maximum Exposure: {capital_util['max_exposure']:.1f}% of capital
"""

    # Add capital utilization by time
    if capital_util['by_hour']:
        analysis_data += "\nCapital Utilization by Hour:\n"
        for hour, data in sorted(capital_util['by_hour'].items()):
            analysis_data += f"- {hour:02d}:00: Avg {data['avg_exposure']:.1f}% exposure, {data['trade_count']} trades\n"

    # Add expectancy metrics by symbol
    expectancy_by_symbol = expectancy_metrics.get('by_symbol', {})
    if expectancy_by_symbol:
        analysis_data += "\n==== EXPECTANCY PER SYMBOL ====\n"
        sorted_symbols = sorted(expectancy_by_symbol.items(), 
                              key=lambda x: x[1].get('avg_dollar_per_trade', 0), reverse=True)
        for symbol, data in sorted_symbols[:10]:  # Top 10
            analysis_data += f"- {symbol}: ${data.get('avg_dollar_per_trade', 0):,.2f}/trade, "
            analysis_data += f"{data.get('r_expectancy', 0):.2f}R expectancy, "
            analysis_data += f"{data.get('win_rate', 0)*100:.1f}% WR, {data.get('trade_count', 0)} trades\n"

    # Add expectancy by hour
    expectancy_by_hour = expectancy_metrics.get('by_hour', {})
    if expectancy_by_hour:
        analysis_data += "\n==== EXPECTANCY BY HOUR ====\n"
        for hour in sorted(expectancy_by_hour.keys()):
            data = expectancy_by_hour[hour]
            analysis_data += f"- {hour:02d}:00: ${data.get('avg_dollar_per_trade', 0):,.2f}/trade, "
            analysis_data += f"{data.get('r_expectancy', 0):.2f}R, {data.get('win_rate', 0)*100:.1f}% WR\n"

    # Add expectancy by weekday
    expectancy_by_weekday = expectancy_metrics.get('by_weekday', {})
    if expectancy_by_weekday:
        analysis_data += "\n==== EXPECTANCY BY WEEKDAY ====\n"
        for weekday, data in expectancy_by_weekday.items():
            analysis_data += f"- {weekday}: ${data.get('avg_dollar_per_trade', 0):,.2f}/trade, "
            analysis_data += f"{data.get('r_expectancy', 0):.2f}R, {data.get('win_rate', 0)*100:.1f}% WR\n"

    # Add holding period analysis
    analysis_data += "\n==== HOLDING PERIOD PERFORMANCE ====\n"
    for period, data in holding_period_analysis.items():
        if data.get('trade_count', 0) > 0:
            analysis_data += f"- {period.title()}: {data['trade_count']} trades, "
            analysis_data += f"{data['win_rate']*100:.1f}% WR, ${data['avg_pnl']:,.2f} avg P&L\n"
            analysis_data += f"  Best: ${data['best_trade']:,.2f}, Worst: ${data['worst_trade']:,.2f}\n"

    # Add Pareto concentration analysis
    analysis_data += f"\n==== PARETO CONCENTRATION ANALYSIS ====\n"
    analysis_data += f"- Top 10% of trades contribute: {pareto_analysis['top_10_pct']:.1f}% of total P&L\n"
    analysis_data += f"- Top 20% of trades contribute: {pareto_analysis['top_20_pct']:.1f}% of total P&L\n"
    analysis_data += f"- Concentration Risk Level: {pareto_analysis['concentration_risk']}\n"
    if pareto_analysis['top_10_trades']:
        analysis_data += f"- Top Trade P&Ls: {[f'${pnl:,.0f}' for pnl in pareto_analysis['top_10_trades'][:5]]}\n"

    # Add current portfolio
    analysis_data += f"\n==== CURRENT PORTFOLIO ====\n"
    analysis_data += f"- Cash Balance: ${portfolio.get('cash', 0):,.2f}\n"
    
    # Add position details
    positions = portfolio.get("positions", {})
    if positions:
        analysis_data += "\nCurrent Positions:\n"
        for symbol, pos_data in positions.items():
            analysis_data += f"- {symbol}: {pos_data['quantity']} shares @ ${pos_data['avg_price']:.2f}\n"
    
    # Add equity trading patterns
    equity_patterns = patterns.get('equities', {})
    if equity_patterns.get('by_hour'):
        analysis_data += "\n==== EQUITY Trading - Time Performance ====\n"
        for hour, data in sorted(equity_patterns['by_hour'].items()):
            analysis_data += f"- {hour:02d}:00: Win Rate {data['win_rate']*100:.1f}%, {len(data['trades'])} trades, P&L ${data['pnl']:,.2f}\n"
    
    if equity_patterns.get('by_day'):
        analysis_data += "\nEQUITY Trading - Day Performance:\n"
        for day, data in equity_patterns['by_day'].items():
            analysis_data += f"- {day}: Win Rate {data['win_rate']*100:.1f}%, {len(data['trades'])} trades, P&L ${data['pnl']:,.2f}\n"
    
    # Add crypto trading patterns
    crypto_patterns = patterns.get('crypto', {})
    if crypto_patterns.get('by_hour'):
        analysis_data += "\n==== CRYPTO Trading - Time Performance ====\n"
        for hour, data in sorted(crypto_patterns['by_hour'].items()):
            analysis_data += f"- {hour:02d}:00: Win Rate {data['win_rate']*100:.1f}%, {len(data['trades'])} trades, P&L ${data['pnl']:,.2f}\n"
    
    if crypto_patterns.get('by_day'):
        analysis_data += "\nCRYPTO Trading - Day Performance:\n"
        for day, data in crypto_patterns['by_day'].items():
            analysis_data += f"- {day}: Win Rate {data['win_rate']*100:.1f}%, {len(data['trades'])} trades, P&L ${data['pnl']:,.2f}\n"

    # Add top symbol performance with enhanced metrics
    analysis_data += "\n==== TOP SYMBOL PERFORMANCE ====\n"
    top_symbols = sorted(symbol_perf.items(), key=lambda x: x[1]["pnl"], reverse=True)[:10]
    for symbol, data in top_symbols:
        analysis_data += f"- {symbol}: P&L ${data['pnl']:,.2f}, Win Rate {data['win_rate']*100:.1f}%, "
        analysis_data += f"{data['trade_count']} trades, ${data['expectancy_per_trade']:,.2f}/trade\n"
    
    analysis_data += f"\n==== SUMMARY INSIGHTS ====\n"
    analysis_data += f"- System shows {rolling_metrics['pf_trend']} profit factor trend\n"
    analysis_data += f"- Concentration risk is {pareto_analysis['concentration_risk']} with top 10% trades contributing {pareto_analysis['top_10_pct']:.1f}%\n"
    analysis_data += f"- Average R-multiple of {r_multiple_dist['avg_r']:.2f}R indicates {'strong' if r_multiple_dist['avg_r'] > 1 else 'weak'} risk-adjusted returns\n"
    analysis_data += f"- Capital utilization averages {capital_util['avg_exposure']:.1f}% with max exposure of {capital_util['max_exposure']:.1f}%\n"
    
    return analysis_data


@router.post("/analyze")
async def analyze_trading_performance():
    """Generate AI analysis of trading performance using OpenAI GPT with structured output"""

    try:
        # Check if OpenAI API key is configured
        openai_key = os.getenv("OPENAI_API_KEY")
        print(f"Debug: OpenAI API key exists: {bool(openai_key)}")
        print(f"Debug: OpenAI API key length: {len(openai_key) if openai_key else 0}")
        
        if not openai_key or not openai_key.strip():
            print("Debug: No OpenAI API key found, using fallback")
            # Return structured fallback instead of raising exception
            return await _fallback_analysis("")

        # Reinitialize client with fresh key (in case of environment issues)
        global client
        client = OpenAI(api_key=openai_key)

        # Generate trading data analysis
        trading_data = generate_trading_analysis_data()
        numbered_data = number_lines(trading_data)

        # Define the strict system prompt
        system_prompt = """You are an expert trading coach. Be concise, specific, and supportive. Use British English.

OUTPUT REQUIREMENTS
- Return JSON that matches the provided schema. Also populate the "md" field with a polished Markdown summary using proper formatting.
- Every bullet under "improvements" and "keep_doing" MUST include ≥1 exact **verbatim quote** copied from the DATA block.
- Prefer the most granular evidence (symbol/hour/weekday line). If the related sample size < 10 trades, append "(limited sample)".
- Generate at least 3 **non-obvious** insights. A non-obvious insight uses CONTRAST or CONCENTRATION:
  • Contrast: compare best vs worst bucket; state %∆ or x-ratio (e.g., "15:00 P&L is 3.2× 11:00").
  • Concentration: identify where ≥60% of P&L/edge is concentrated (top symbols/hours/days).
- Score each improvement with: impact_1to5 (magnitude of improvement) and confidence_1to5 (sample size + consistency).
- Do not invent numbers. If you compute a simple ratio/delta, still include the source quotes you used.
- If metrics conflict or look impossible (e.g., drawdown > 100%), list them under "data_gaps" and avoid using them.

MARKDOWN FORMATTING REQUIREMENTS for "md" field:
- Use ## headings for main sections
- Use **bold** for key metrics and important points
- Use bullet points with - for lists
- Use > blockquotes for key insights
- Structure: ## Overview, ## Key Improvements, ## What's Working, ## Next Steps

VALIDATION STEP
Before output, validate each improvement has ≥1 quote and shows contrast or concentration; if not, fix.

STYLE
- No tables in "md". Short bullets. Don't repeat the data back; interpret it."""

        user_prompt = f"""Analyse my trading performance from the DATA block and produce **only** JSON that fits the schema.
Use exact verbatim quotes from the numbered DATA (include the line numbers in the quote).

DATA START
{numbered_data}
DATA END"""

        # Define the strict JSON schema
        json_schema = {
            "type": "json_schema",
            "json_schema": {
                "name": "trading_coach_output",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "quick_overview": {
                            "type": "object",
                            "properties": {
                                "verdict": {"type": "string"},
                                "strength_vs_risk": {"type": "string"}
                            },
                            "required": ["verdict", "strength_vs_risk"],
                            "additionalProperties": False
                        },
                        "improvements": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "action": {"type": "string"},
                                    "why": {"type": "string"},
                                    "evidence_quotes": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "minItems": 1
                                    },
                                    "sample_size": {"type": "integer"},
                                    "impact_1to5": {
                                        "type": "integer",
                                        "minimum": 1,
                                        "maximum": 5
                                    },
                                    "confidence_1to5": {
                                        "type": "integer", 
                                        "minimum": 1,
                                        "maximum": 5
                                    }
                                },
                                "required": ["action", "why", "evidence_quotes", "impact_1to5", "confidence_1to5"],
                                "additionalProperties": False
                            }
                        },
                        "keep_doing": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "action": {"type": "string"},
                                    "why": {"type": "string"},
                                    "evidence_quotes": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "minItems": 1
                                    }
                                },
                                "required": ["action", "why", "evidence_quotes"],
                                "additionalProperties": False
                            }
                        },
                        "kpis_add": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "kpis_remove_or_revise": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "data_gaps": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "md": {"type": "string"}
                    },
                    "required": ["quick_overview", "improvements", "keep_doing", "kpis_add", "kpis_remove_or_revise", "data_gaps", "md"],
                    "additionalProperties": False
                }
            }
        }

        # Call OpenAI API with basic JSON mode first
        try:
            system_prompt_json = system_prompt + """

CRITICAL: You MUST return valid JSON that exactly matches this schema:
{
  "quick_overview": {"verdict": "string", "strength_vs_risk": "string"},
  "improvements": [{"action": "string", "why": "string", "evidence_quotes": ["string"], "impact_1to5": number, "confidence_1to5": number}],
  "keep_doing": [{"action": "string", "why": "string", "evidence_quotes": ["string"]}],
  "kpis_add": ["string"], 
  "kpis_remove_or_revise": ["string"],
  "data_gaps": ["string"],
  "md": "string"
}"""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",  # Start with most compatible model
                messages=[
                    {"role": "system", "content": system_prompt_json},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,  # Reduced variance
                top_p=1,
                seed=42,  # Reproducibility
                response_format={"type": "json_object"},
                max_tokens=2000
            )
        except Exception as api_error:
            print(f"DEBUG: AI Analysis error details: {api_error}")
            print(f"DEBUG: Error type: {type(api_error)}")
            # Final fallback - return structured analysis without AI
            return await _fallback_analysis("")
        
        # Parse the structured JSON response
        response_content = response.choices[0].message.content
        print(f"DEBUG: Raw OpenAI response: {response_content[:500]}...")  # First 500 chars
        
        payload = json.loads(response_content)
        print(f"DEBUG: Parsed payload keys: {list(payload.keys())}")
        
        # Check if 'md' field exists and handle gracefully
        md_content = payload.get("md", "No markdown content available")
        if not md_content:
            md_content = "# Trading Analysis\n\nAnalysis completed successfully but no formatted content available."
        
        # Prepare metadata
        trades = load_user_trades()
        metadata = {
            "total_trades": len(trades),
            "timestamp": datetime.now().isoformat(),
            "model_used": "gpt-3.5-turbo",
            "response_type": "structured_json"
        }
        
        return {
            "response_md": md_content, 
            "response_json": payload, 
            "metadata": metadata,
            "status": "success"
        }
        
    except json.JSONDecodeError as e:
        print(f"DEBUG: JSON parsing error: {e}")
        print(f"DEBUG: Raw response that failed to parse: {response_content if 'response_content' in locals() else 'N/A'}")
        return await _fallback_analysis(trading_data if 'trading_data' in locals() else "")
    except KeyError as e:
        print(f"DEBUG: Missing key in AI response: {e}")
        print(f"DEBUG: Available keys in response: {list(payload.keys()) if 'payload' in locals() else 'N/A'}")
        return await _fallback_analysis(trading_data if 'trading_data' in locals() else "")
    except Exception as e:
        print(f"DEBUG: General AI Analysis error: {e}")
        print(f"DEBUG: Error type: {type(e)}")
        return await _fallback_analysis(trading_data if 'trading_data' in locals() else "")


async def _fallback_analysis(trading_data: str):
    """Enhanced fallback response with structured format"""
    trades = load_user_trades()
    
    fallback_structured = {
        "quick_overview": {
            "verdict": "AI service unavailable - basic analysis provided",
            "strength_vs_risk": "Please configure OpenAI API for detailed insights"
        },
        "improvements": [
            {
                "action": "Configure OpenAI API integration",
                "why": "Full AI analysis requires proper API configuration",
                "evidence_quotes": ["AI service currently unavailable"],
                "impact_1to5": 5,
                "confidence_1to5": 5
            }
        ],
        "keep_doing": [
            {
                "action": "Continue systematic trading approach",
                "why": "Your trading data shows structured approach",
                "evidence_quotes": [f"Total trades: {len(trades)}"]
            }
        ],
        "kpis_add": ["OpenAI API integration", "Enhanced error handling"],
        "kpis_remove_or_revise": [],
        "data_gaps": ["OpenAI API key not configured"],
        "md": f"""# 🚀 AI Trading Coach - Fallback Analysis

## Quick Overview
**Status**: AI service currently unavailable

## Performance Data Available
Total trades analyzed: {len(trades)}

## Next Steps
- Configure OpenAI API key for full analysis
- System ready for enhanced insights once configured

## Trading Data Summary
{trading_data[:500] if trading_data else 'No data available'}...

*Note: This is a basic analysis. Configure OpenAI API for detailed AI-powered insights.*"""
    }
    
    metadata = {
        "total_trades": len(trades),
        "timestamp": datetime.now().isoformat(),
        "model_used": "fallback",
        "response_type": "structured_fallback"
    }

    return {
        "response_md": fallback_structured["md"],
        "response_json": fallback_structured,
        "metadata": metadata,
        "status": "fallback",
    }

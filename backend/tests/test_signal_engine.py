import numpy as np
import pandas as pd
from app.services.signal_engine import signal_engine


def test_generate_signal_returns_none_or_signal():
    df = pd.DataFrame({
        "close": np.cumsum(np.random.randn(100)) + 100,
        "volume": np.random.randint(1000, 10000, 100),
    })
    signal = signal_engine.generate_signal("NSE:RELIANCE", df)
    assert signal is None or signal.symbol == "NSE:RELIANCE"

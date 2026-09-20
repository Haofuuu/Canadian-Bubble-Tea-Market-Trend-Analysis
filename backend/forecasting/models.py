import numpy as np


class RollingMeanModel:
    def __init__(self, window):
        self.window = window
        self.values = None

    def fit(self, values):
        self.values = np.asarray(values, dtype=float)

        if len(self.values) < self.window:
            raise ValueError(
                f"Rolling mean requires at least {self.window} observations."
            )

        return self

    def predict(self, horizon):
        estimate = self.values[-self.window:].mean()
        return np.repeat(estimate, horizon)


class SeasonalNaiveModel:
    def __init__(self, season_length=52):
        self.season_length = season_length
        self.values = None

    def fit(self, values):
        self.values = np.asarray(values, dtype=float)

        if len(self.values) < self.season_length:
            raise ValueError(
                f"Seasonal model requires at least "
                f"{self.season_length} observations."
            )

        return self

    def predict(self, horizon):
        if horizon > self.season_length:
            raise ValueError("Horizon cannot exceed the seasonal length.")

        start = len(self.values) - self.season_length
        return np.array([
            self.values[start + step]
            for step in range(horizon)
        ])
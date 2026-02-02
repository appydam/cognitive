"""Client for Federal Reserve Economic Data (FRED) API.

This module provides a Python client for accessing macroeconomic data from the
St. Louis Federal Reserve's FRED API. The API is free and provides access to
500,000+ economic time series.

API Documentation: https://fred.stlouisfed.org/docs/api/
Registration: https://fredaccount.stlouisfed.org

Rate Limits:
- 2,000 JSON requests per day
- 1,000 CSV/Excel requests per day
"""

import os
import requests
from datetime import datetime, timedelta
from typing import Optional


FRED_BASE_URL = "https://api.stlouisfed.org/fred"


class FREDClient:
    """Client for fetching economic data from FRED API.

    Example:
        # Initialize client (reads FRED_API_KEY from env)
        fred = FREDClient()

        # Get latest Fed Funds Rate
        rate = fred.get_latest_value("FEDFUNDS")
        print(f"Current Fed Funds Rate: {rate}%")

        # Get CPI history for last year
        cpi_data = fred.get_series_observations(
            series_id="CPIAUCSL",
            start_date="2025-02-01",
            end_date="2026-02-01",
        )
    """

    def __init__(self, api_key: Optional[str] = None):
        """Initialize FRED API client.

        Args:
            api_key: FRED API key (32-character string)
                If not provided, reads from FRED_API_KEY environment variable

        Raises:
            ValueError: If no API key is provided or found in environment
        """
        self.api_key = api_key or os.getenv("FRED_API_KEY")

        if not self.api_key:
            raise ValueError(
                "FRED_API_KEY not set. "
                "Get a free API key from https://fredaccount.stlouisfed.org "
                "and set it in your .env file."
            )

        if len(self.api_key) != 32:
            raise ValueError(
                f"Invalid FRED API key format. Expected 32 characters, got {len(self.api_key)}. "
                "Check your API key at https://fredaccount.stlouisfed.org"
            )

    def get_series_observations(
        self,
        series_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 1000,
        units: str = "lin",
    ) -> list[dict]:
        """Fetch observations (data points) for a FRED series.

        Args:
            series_id: FRED series ID (e.g., "FEDFUNDS", "CPIAUCSL", "UNRATE")
                Find series IDs at https://fred.stlouisfed.org
            start_date: Start date in YYYY-MM-DD format
                Defaults to 1 year ago
            end_date: End date in YYYY-MM-DD format
                Defaults to today
            limit: Maximum number of observations to return (max 100000)
            units: Data transformation:
                - "lin": Levels (no change) - default
                - "chg": Change (period-over-period)
                - "ch1": Change from year ago
                - "pch": Percent change
                - "pc1": Percent change from year ago
                - "pca": Compounded annual rate of change
                - "log": Natural log

        Returns:
            List of observation dictionaries with keys:
                - date (str): Observation date (YYYY-MM-DD)
                - value (str): Observation value (may be "." for missing)
                - realtime_start (str): When this vintage was available
                - realtime_end (str): When this vintage stopped being current

        Raises:
            requests.HTTPError: If API request fails

        Example:
            fred = FREDClient()

            # Get Fed Funds Rate for last year
            data = fred.get_series_observations("FEDFUNDS")
            for obs in data[-5:]:
                print(f"{obs['date']}: {obs['value']}%")

            # Get year-over-year inflation rate
            cpi_yoy = fred.get_series_observations(
                series_id="CPIAUCSL",
                units="pc1",  # Percent change from year ago
            )
        """
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")

        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")

        url = f"{FRED_BASE_URL}/series/observations"
        params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
            "observation_start": start_date,
            "observation_end": end_date,
            "limit": limit,
            "units": units,
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            if response.status_code == 400:
                error_msg = response.json().get("error_message", str(e))
                raise ValueError(f"FRED API error: {error_msg}") from e
            raise

        data = response.json()
        return data.get("observations", [])

    def get_latest_value(self, series_id: str, units: str = "lin") -> float:
        """Get the most recent value for a FRED series.

        Args:
            series_id: FRED series ID
            units: Data transformation (see get_series_observations for options)

        Returns:
            Latest observation value as float

        Raises:
            ValueError: If no data is available or value is missing
            requests.HTTPError: If API request fails

        Example:
            fred = FREDClient()

            # Get current Fed Funds Rate
            rate = fred.get_latest_value("FEDFUNDS")
            print(f"Fed Funds Rate: {rate}%")

            # Get current unemployment rate
            unemployment = fred.get_latest_value("UNRATE")
            print(f"Unemployment: {unemployment}%")
        """
        # Fetch only the most recent observation
        observations = self.get_series_observations(
            series_id=series_id,
            limit=1,
            units=units,
        )

        if not observations:
            raise ValueError(f"No data available for series {series_id}")

        latest = observations[-1]
        value_str = latest["value"]

        if value_str == ".":
            raise ValueError(
                f"Latest value for series {series_id} is missing (marked as '.')"
            )

        try:
            return float(value_str)
        except ValueError as e:
            raise ValueError(
                f"Could not parse value '{value_str}' for series {series_id}"
            ) from e

    def get_series_info(self, series_id: str) -> dict:
        """Get metadata about a FRED series.

        Args:
            series_id: FRED series ID

        Returns:
            Dictionary with series metadata:
                - id: Series ID
                - title: Full series title
                - observation_start: Earliest available date
                - observation_end: Latest available date
                - frequency: Data frequency (Daily, Monthly, Quarterly, etc.)
                - units: Units of measurement
                - seasonal_adjustment: Seasonal adjustment status

        Raises:
            requests.HTTPError: If API request fails

        Example:
            fred = FREDClient()
            info = fred.get_series_info("FEDFUNDS")
            print(f"Title: {info['title']}")
            print(f"Frequency: {info['frequency']}")
            print(f"Data from {info['observation_start']} to {info['observation_end']}")
        """
        url = f"{FRED_BASE_URL}/series"
        params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()
        series_list = data.get("seriess", [])

        if not series_list:
            raise ValueError(f"Series {series_id} not found")

        return series_list[0]

    def search_series(self, search_text: str, limit: int = 10) -> list[dict]:
        """Search for FRED series by keyword.

        Args:
            search_text: Search query (e.g., "inflation", "unemployment")
            limit: Maximum number of results to return

        Returns:
            List of series metadata dictionaries

        Example:
            fred = FREDClient()
            results = fred.search_series("inflation", limit=5)
            for series in results:
                print(f"{series['id']}: {series['title']}")
        """
        url = f"{FRED_BASE_URL}/series/search"
        params = {
            "search_text": search_text,
            "api_key": self.api_key,
            "file_type": "json",
            "limit": limit,
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()
        return data.get("seriess", [])

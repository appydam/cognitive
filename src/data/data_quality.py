"""Data quality and verification framework.

This module provides:
1. Data verification and validation
2. Quality scoring
3. Source tracking
4. Data freshness monitoring
"""

import json
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum


class ConfidenceLevel(Enum):
    """Confidence levels for data sources."""
    HIGH = "high"  # Verified from primary source (10-K, annual report)
    MEDIUM = "medium"  # Industry analyst estimates with corroborating evidence
    LOW = "low"  # Estimates without strong verification
    UNKNOWN = "unknown"  # No verification done


class DataFreshness(Enum):
    """Data freshness categories."""
    CURRENT = "current"  # < 6 months old
    RECENT = "recent"  # 6-12 months old
    STALE = "stale"  # 12-24 months old
    OUTDATED = "outdated"  # > 24 months old


@dataclass
class DataQualityScore:
    """Quality score for a data point."""
    confidence: ConfidenceLevel
    freshness: DataFreshness
    has_source: bool
    has_verification: bool
    overall_score: float  # 0.0-1.0

    def is_production_ready(self) -> bool:
        """Check if data meets production quality standards."""
        return (
            self.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]
            and self.freshness in [DataFreshness.CURRENT, DataFreshness.RECENT]
            and self.has_source
            and self.overall_score >= 0.6
        )


def calculate_data_quality(
    confidence: str,
    verified_date: str | None,
    source: str | None,
    source_url: str | None
) -> DataQualityScore:
    """
    Calculate quality score for a data point.

    Args:
        confidence: Confidence level string
        verified_date: ISO date string when data was verified
        source: Source description
        source_url: URL to source

    Returns:
        DataQualityScore object
    """
    # Parse confidence
    try:
        conf = ConfidenceLevel(confidence.lower())
    except (ValueError, AttributeError):
        conf = ConfidenceLevel.UNKNOWN

    # Calculate freshness
    freshness = DataFreshness.OUTDATED
    if verified_date:
        try:
            verified = datetime.fromisoformat(verified_date)
            age_days = (datetime.now() - verified).days

            if age_days < 180:
                freshness = DataFreshness.CURRENT
            elif age_days < 365:
                freshness = DataFreshness.RECENT
            elif age_days < 730:
                freshness = DataFreshness.STALE
            else:
                freshness = DataFreshness.OUTDATED
        except (ValueError, TypeError):
            pass

    # Check for sources
    has_source = bool(source and len(source) > 10)
    has_verification = bool(source_url)

    # Calculate overall score
    score = 0.0

    # Confidence weight: 40%
    conf_scores = {
        ConfidenceLevel.HIGH: 0.4,
        ConfidenceLevel.MEDIUM: 0.25,
        ConfidenceLevel.LOW: 0.1,
        ConfidenceLevel.UNKNOWN: 0.0,
    }
    score += conf_scores.get(conf, 0.0)

    # Freshness weight: 30%
    fresh_scores = {
        DataFreshness.CURRENT: 0.3,
        DataFreshness.RECENT: 0.2,
        DataFreshness.STALE: 0.1,
        DataFreshness.OUTDATED: 0.0,
    }
    score += fresh_scores.get(freshness, 0.0)

    # Source documentation weight: 20%
    if has_source:
        score += 0.1
    if has_verification:
        score += 0.1

    # Completeness weight: 10%
    score += 0.1  # Base score for having data at all

    return DataQualityScore(
        confidence=conf,
        freshness=freshness,
        has_source=has_source,
        has_verification=has_verification,
        overall_score=min(1.0, score)
    )


def load_verified_relationships(
    file_path: str = "data/verified_relationships.json"
) -> tuple[list[dict], dict]:
    """
    Load verified relationships with quality metadata.

    Args:
        file_path: Path to verified relationships file

    Returns:
        Tuple of (relationships list, metadata dict)
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Verified relationships file not found: {file_path}\n"
            "This file contains manually verified supplier relationships."
        )

    with open(path) as f:
        data = json.load(f)

    return data.get("relationships", []), data.get("metadata", {})


def validate_relationship_data(relationship: dict) -> tuple[bool, list[str]]:
    """
    Validate a relationship data point.

    Args:
        relationship: Relationship dict

    Returns:
        Tuple of (is_valid, list of issues)
    """
    issues = []

    # Required fields
    required = ["supplier", "customer", "revenue_pct", "confidence", "source"]
    for field in required:
        if field not in relationship:
            issues.append(f"Missing required field: {field}")

    # Validate revenue percentage
    if "revenue_pct" in relationship:
        pct = relationship["revenue_pct"]
        if not (0 <= pct <= 100):
            issues.append(f"Invalid revenue_pct: {pct} (must be 0-100)")
        if pct > 50:
            # Flag for review - very high dependency
            issues.append(f"WARNING: Very high dependency: {pct}% (verify accuracy)")

    # Validate confidence level
    if "confidence" in relationship:
        conf = relationship["confidence"]
        if conf not in ["high", "medium", "low", "unknown"]:
            issues.append(f"Invalid confidence level: {conf}")

    # Check for source documentation
    if "source" in relationship:
        source = relationship["source"]
        if len(source) < 10:
            issues.append("Source description too brief")
        if "Estimate" in source and relationship.get("confidence") == "high":
            issues.append("Confidence 'high' but source is 'Estimate' - inconsistent")

    # Check freshness
    if "verified_date" in relationship:
        try:
            verified = datetime.fromisoformat(relationship["verified_date"])
            age_days = (datetime.now() - verified).days
            if age_days > 365:
                issues.append(f"Data is {age_days} days old - needs refresh")
        except (ValueError, TypeError):
            issues.append("Invalid verified_date format")
    else:
        issues.append("Missing verified_date - unknown data freshness")

    is_valid = len([i for i in issues if not i.startswith("WARNING")]) == 0
    return is_valid, issues


def generate_data_quality_report(
    relationships: list[dict]
) -> dict:
    """
    Generate a comprehensive data quality report.

    Args:
        relationships: List of relationship dicts

    Returns:
        Report dict with quality metrics
    """
    report = {
        "total_relationships": len(relationships),
        "by_confidence": {"high": 0, "medium": 0, "low": 0, "unknown": 0},
        "by_freshness": {"current": 0, "recent": 0, "stale": 0, "outdated": 0},
        "production_ready": 0,
        "needs_verification": 0,
        "issues": [],
        "quality_scores": [],
    }

    for rel in relationships:
        # Calculate quality score
        quality = calculate_data_quality(
            confidence=rel.get("confidence", "unknown"),
            verified_date=rel.get("verified_date"),
            source=rel.get("source"),
            source_url=rel.get("source_url")
        )

        report["quality_scores"].append(quality.overall_score)
        report["by_confidence"][quality.confidence.value] += 1
        report["by_freshness"][quality.freshness.value] += 1

        if quality.is_production_ready():
            report["production_ready"] += 1
        else:
            report["needs_verification"] += 1

        # Validate
        is_valid, issues = validate_relationship_data(rel)
        if not is_valid or issues:
            report["issues"].append({
                "relationship": f"{rel.get('supplier')} → {rel.get('customer')}",
                "issues": issues
            })

    # Calculate average quality
    if report["quality_scores"]:
        report["average_quality_score"] = sum(report["quality_scores"]) / len(report["quality_scores"])
    else:
        report["average_quality_score"] = 0.0

    report["production_ready_pct"] = (
        report["production_ready"] / report["total_relationships"] * 100
        if report["total_relationships"] > 0 else 0
    )

    return report


def print_quality_report(report: dict) -> None:
    """Print data quality report in readable format."""
    print("\n" + "=" * 60)
    print("DATA QUALITY REPORT")
    print("=" * 60)

    print(f"\nTotal Relationships: {report['total_relationships']}")
    print(f"Average Quality Score: {report['average_quality_score']:.2f}/1.00")
    print(f"Production Ready: {report['production_ready']} ({report['production_ready_pct']:.1f}%)")
    print(f"Needs Verification: {report['needs_verification']}")

    print("\nConfidence Distribution:")
    for level, count in report['by_confidence'].items():
        print(f"  {level.upper()}: {count}")

    print("\nFreshness Distribution:")
    for fresh, count in report['by_freshness'].items():
        print(f"  {fresh.upper()}: {count}")

    if report['issues']:
        print(f"\nIssues Found: {len(report['issues'])}")
        for item in report['issues'][:10]:  # Show first 10
            print(f"\n  {item['relationship']}:")
            for issue in item['issues']:
                print(f"    - {issue}")

        if len(report['issues']) > 10:
            print(f"\n  ... and {len(report['issues']) - 10} more issues")

    print("\n" + "=" * 60)

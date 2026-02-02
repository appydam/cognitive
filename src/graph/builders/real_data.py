"""Build causal graph from real data sources (SEC filings + price correlations)."""

import json
from pathlib import Path
from datetime import datetime

from src.core.graph import CausalGraph, CausalLink
from src.adapters.securities import (
    create_company,
    create_etf,
    create_supplier_link,
    create_sector_link,
    create_correlation_link,
)


def load_sec_relationships(file_path: str = "data/sec_relationships.json") -> list[dict]:
    """
    Load SEC 10-K supplier relationships from cache.

    Args:
        file_path: Path to cached SEC relationships

    Returns:
        List of relationship dicts
    """
    path = Path(file_path)
    if not path.exists():
        print(f"Warning: SEC relationships file not found: {file_path}")
        print("Run: python scripts/fetch_sec_relationships.py")
        return []

    with open(path) as f:
        return json.load(f)


def load_correlations(file_path: str = "data/correlations.json") -> list[dict]:
    """
    Load price correlations from cache.

    Args:
        file_path: Path to cached correlations

    Returns:
        List of correlation dicts
    """
    path = Path(file_path)
    if not path.exists():
        print(f"Warning: Correlations file not found: {file_path}")
        print("Run: python scripts/calculate_correlations.py")
        return []

    with open(path) as f:
        return json.load(f)


def load_verified_relationships(file_path: str = "data/verified_relationships.json") -> list[dict]:
    """
    Load manually verified supplier relationships.

    Args:
        file_path: Path to verified relationships file

    Returns:
        List of relationship dicts
    """
    path = Path(file_path)
    if not path.exists():
        print(f"Warning: Verified relationships file not found: {file_path}")
        return []

    with open(path) as f:
        data = json.load(f)

    return data.get("relationships", [])


def build_graph_from_real_data(
    include_sec: bool = True,
    include_correlations: bool = True,
    include_sectors: bool = True,
    include_verified: bool = True,
    include_sp500_entities: bool = True,
    min_correlation: float = 0.4,
    max_correlation_lag: int = 3,
) -> CausalGraph:
    """
    Build causal graph from real data sources.

    Combines:
    1. SEC 10-K supplier relationships (high confidence)
    2. Historical price correlations (moderate confidence)
    3. Sector relationships (from existing builders)

    Args:
        include_sec: Include SEC filing relationships
        include_correlations: Include correlation-based relationships
        include_sectors: Include sector ETF relationships
        min_correlation: Minimum correlation threshold
        max_correlation_lag: Maximum lag to include from correlations

    Returns:
        CausalGraph with real data-backed relationships
    """
    graph = CausalGraph()

    # Track all tickers we encounter
    all_tickers = set()

    # 1. Add SEC relationships (highest confidence)
    if include_sec:
        print("Loading SEC 10-K relationships...")
        sec_rels = load_sec_relationships()
        print(f"  Found {len(sec_rels)} SEC relationships")

        for rel in sec_rels:
            supplier = rel["supplier"]
            customer = rel["customer"]
            revenue_pct = rel.get("revenue_pct", 10.0)

            all_tickers.add(supplier)
            all_tickers.add(customer)

            # Add entities if not exists
            if supplier not in graph.entities:
                graph.add_entity(create_company(ticker=supplier, name=supplier))
            if customer not in graph.entities:
                graph.add_entity(create_company(ticker=customer, name=customer))

            # Create supplier link
            link = create_supplier_link(
                supplier=supplier,
                customer=customer,
                revenue_percentage=revenue_pct,
                evidence=[rel.get("source", "SEC 10-K")],
            )

            try:
                graph.add_link(link)
            except ValueError as e:
                print(f"  Warning: Could not add link {supplier}→{customer}: {e}")

        print(f"  ✓ Added {len(sec_rels)} SEC-based links")

    # 2. Add correlation-based relationships (moderate confidence)
    if include_correlations:
        print("\nLoading price correlations...")
        corrs = load_correlations()
        print(f"  Found {len(corrs)} correlations")

        # Filter by criteria
        filtered = [
            c for c in corrs
            if abs(c["correlation"]) >= min_correlation
            and c["lag_days"] <= max_correlation_lag
        ]
        print(f"  Filtered to {len(filtered)} (|corr| >= {min_correlation}, lag <= {max_correlation_lag})")

        added_count = 0
        for corr in filtered:
            source = corr["source"]
            target = corr["target"]

            all_tickers.add(source)
            all_tickers.add(target)

            # Add entities if not exists
            if source not in graph.entities:
                graph.add_entity(create_company(ticker=source, name=source))
            if target not in graph.entities:
                graph.add_entity(create_company(ticker=target, name=target))

            # Check if we already have a stronger relationship (SEC-based)
            existing = graph.get_link(source, target)
            if existing and existing.confidence > 0.7:
                # Skip - SEC relationship is stronger
                continue

            # Create correlation link
            link = create_correlation_link(
                entity_a=source,
                entity_b=target,
                correlation=corr["correlation"],
                lag_days=corr["lag_days"],
            )

            # Add evidence
            link.evidence.append(
                f"Historical correlation: {corr['correlation']:.2f} "
                f"(lag: {corr['lag_days']}d, p={corr['p_value']:.4f})"
            )

            try:
                graph.add_link(link)
                added_count += 1
            except ValueError as e:
                print(f"  Warning: Could not add link {source}→{target}: {e}")

        print(f"  ✓ Added {added_count} correlation-based links")

    # 3. Add sector relationships (from existing builder)
    if include_sectors:
        print("\nAdding sector relationships...")
        from .sector import build_sector_graph

        sector_graph = build_sector_graph()

        # Merge sector entities (ETFs, indices)
        for entity in sector_graph.entities.values():
            if entity.id not in graph.entities:
                graph.add_entity(entity)

        # Add sector links for companies we have
        sector_links_added = 0
        for link in sector_graph.iter_links():
            # Only add if both entities exist in our graph
            if link.source in graph.entities and link.target in graph.entities:
                try:
                    graph.add_link(link)
                    sector_links_added += 1
                except ValueError:
                    pass

        print(f"  ✓ Added {sector_links_added} sector links")

    # 4. Add verified relationships (highest confidence, manually verified)
    if include_verified:
        print("\nLoading verified relationships...")
        verified_rels = load_verified_relationships()
        print(f"  Found {len(verified_rels)} verified relationships")

        verified_added = 0
        for rel in verified_rels:
            supplier = rel["supplier"]
            customer = rel["customer"]
            revenue_pct = rel.get("revenue_pct", 10.0)
            confidence_level = rel.get("confidence", "medium")

            # Skip zero-revenue relationships (e.g., Apple dropped Intel)
            if revenue_pct <= 0:
                continue

            all_tickers.add(supplier)
            all_tickers.add(customer)

            # Add entities if not exists
            if supplier not in graph.entities:
                graph.add_entity(create_company(ticker=supplier, name=supplier))
            if customer not in graph.entities:
                graph.add_entity(create_company(ticker=customer, name=customer))

            # Check if we already have this link
            existing = graph.get_link(customer, supplier)
            if existing:
                # Update confidence if verified version is stronger
                if confidence_level == "high" and existing.confidence < 0.85:
                    existing.confidence = 0.85
                continue

            # Create supplier link with higher confidence for verified data
            link = create_supplier_link(
                supplier=supplier,
                customer=customer,
                revenue_percentage=revenue_pct,
                evidence=[rel.get("source", "Verified relationship")],
            )
            # Boost confidence for verified relationships
            if confidence_level == "high":
                link.confidence = 0.85
            else:
                link.confidence = 0.75

            try:
                graph.add_link(link)
                verified_added += 1
            except ValueError as e:
                print(f"  Warning: Could not add verified link {supplier}→{customer}: {e}")

        print(f"  ✓ Added {verified_added} verified relationship links")

    # 5. Load S&P 500 entities (entities only, no new links)
    if include_sp500_entities:
        sp500_file = Path("data/sp500_entities.json")
        if sp500_file.exists():
            print("\nLoading S&P 500 entities...")
            with open(sp500_file) as f:
                sp500_data = json.load(f)

            entities_list = sp500_data.get("entities", sp500_data if isinstance(sp500_data, list) else [])
            sp500_added = 0
            for entity_data in entities_list:
                ticker = entity_data["id"]
                if ticker not in graph.entities:
                    entity = create_company(
                        ticker=ticker,
                        name=entity_data.get("name", ticker),
                    )
                    # Add sector and other attributes
                    if entity_data.get("sector"):
                        entity.attributes["sector"] = entity_data["sector"]
                    if entity_data.get("industry"):
                        entity.attributes["industry"] = entity_data["industry"]
                    if entity_data.get("market_cap"):
                        entity.attributes["market_cap"] = entity_data["market_cap"]
                    if entity_data.get("country"):
                        entity.attributes["country"] = entity_data["country"]

                    graph.add_entity(entity)
                    sp500_added += 1

            print(f"  ✓ Added {sp500_added} S&P 500 entities (total entities now: {graph.num_entities})")
        else:
            print("\n⚠️  S&P 500 entities file not found. Run: python scripts/ingest_sp500_entities.py")

    # Summary
    print("\n" + "=" * 60)
    print("REAL DATA GRAPH SUMMARY")
    print("=" * 60)
    print(f"Total entities: {graph.num_entities}")
    print(f"Total links: {graph.num_links}")
    print(f"Unique tickers from data: {len(all_tickers)}")

    # Count by source type
    source_types = {}
    for link in graph.iter_links():
        st = link.source_type
        source_types[st] = source_types.get(st, 0) + 1

    print("\nLinks by source:")
    for source_type, count in sorted(source_types.items(), key=lambda x: -x[1]):
        print(f"  {source_type}: {count}")

    # Confidence distribution
    high_conf = sum(1 for link in graph.iter_links() if link.confidence > 0.7)
    med_conf = sum(1 for link in graph.iter_links() if 0.5 <= link.confidence <= 0.7)
    low_conf = sum(1 for link in graph.iter_links() if link.confidence < 0.5)

    print("\nConfidence distribution:")
    print(f"  High (>0.7): {high_conf}")
    print(f"  Medium (0.5-0.7): {med_conf}")
    print(f"  Low (<0.5): {low_conf}")

    print("=" * 60)

    return graph


def save_real_data_graph(graph: CausalGraph, output_path: str = "data/graphs/real_data_graph.json") -> None:
    """
    Save real data graph to file.

    Args:
        graph: CausalGraph to save
        output_path: Output file path
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    graph.save(output_path)
    print(f"\n✓ Saved graph to: {output_path}")

    # Also save a metadata file
    metadata = {
        "created_at": datetime.now().isoformat(),
        "num_entities": graph.num_entities,
        "num_links": graph.num_links,
        "source_files": [
            "data/sec_relationships.json",
            "data/correlations.json"
        ]
    }

    metadata_path = path.parent / "real_data_graph_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Saved metadata to: {metadata_path}")

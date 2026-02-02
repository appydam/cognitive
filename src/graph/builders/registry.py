"""Builder registry for domain-agnostic graph construction.

This module provides a central registry for graph builders, enabling dynamic
composition of graphs from multiple domains without hard-coding dependencies.
"""

from typing import Callable, Any
from src.core.graph import CausalGraph
from src.core.graph.graph import merge_graphs


class BuilderRegistry:
    """Central registry for graph builders.

    The builder registry allows new domains to be added without modifying
    core graph building code. Each domain registers its builder function,
    and graphs can be composed dynamically.

    Example:
        # Register builders (typically done in builder modules)
        BuilderRegistry.register("securities_sector", build_sector_graph)
        BuilderRegistry.register("securities_supply", build_supply_chain_graph)
        BuilderRegistry.register("macro", build_macro_graph)

        # Build graph from multiple domains
        graph = BuilderRegistry.build(["securities_sector", "macro"])

        # Query available domains
        domains = BuilderRegistry.available_domains()
        # ['securities_sector', 'securities_supply', 'macro']
    """

    _builders: dict[str, Callable[..., CausalGraph]] = {}

    @classmethod
    def register(cls, domain: str, builder_func: Callable[..., CausalGraph]) -> None:
        """Register a builder function for a domain.

        Args:
            domain: Unique domain identifier (e.g., "securities_sector", "macro")
            builder_func: Function that returns a CausalGraph
                Must accept **kwargs for flexibility

        Raises:
            ValueError: If domain is already registered

        Example:
            def build_my_domain(**kwargs):
                graph = CausalGraph()
                # ... populate graph ...
                return graph

            BuilderRegistry.register("my_domain", build_my_domain)
        """
        if domain in cls._builders:
            raise ValueError(f"Builder for domain '{domain}' is already registered")

        cls._builders[domain] = builder_func

    @classmethod
    def unregister(cls, domain: str) -> None:
        """Unregister a builder (useful for testing).

        Args:
            domain: Domain identifier to remove
        """
        cls._builders.pop(domain, None)

    @classmethod
    def build(cls, domains: list[str], **kwargs: Any) -> CausalGraph:
        """Build graph from multiple registered domains.

        Args:
            domains: List of domain identifiers to include
            **kwargs: Additional arguments passed to all builders

        Returns:
            Merged CausalGraph from all specified domains

        Raises:
            ValueError: If any domain is not registered or no domains specified

        Example:
            # Build graph from securities and macro domains
            graph = BuilderRegistry.build(
                domains=["securities_sector", "macro"],
                include_low_confidence=False,  # Passed to all builders
            )
        """
        if not domains:
            raise ValueError("No domains specified")

        graphs = []

        for domain in domains:
            if domain not in cls._builders:
                available = ", ".join(cls.available_domains())
                raise ValueError(
                    f"Unknown domain: '{domain}'. "
                    f"Available domains: {available}"
                )

            builder_func = cls._builders[domain]

            try:
                graph = builder_func(**kwargs)
                graphs.append(graph)
                print(f"[BuilderRegistry] ✓ Built domain '{domain}': "
                      f"{len(graph.entities)} entities, {len(list(graph.iter_links()))} links")
            except Exception as e:
                print(f"[BuilderRegistry] ✗ Failed to build domain '{domain}': {e}")
                raise

        # Merge all graphs
        if len(graphs) == 1:
            merged = graphs[0]
        else:
            merged = merge_graphs(*graphs)
            print(f"[BuilderRegistry] ✓ Merged {len(domains)} domains: "
                  f"{len(merged.entities)} total entities")

        # Add any pending links from domains (e.g., macro links to securities)
        pending_count = 0
        for graph in graphs:
            if hasattr(graph, '_pending_macro_links'):
                for link in graph._pending_macro_links:
                    try:
                        merged.add_link(link)
                        pending_count += 1
                    except ValueError:
                        # Entity doesn't exist, skip silently
                        pass

        if pending_count > 0:
            print(f"[BuilderRegistry] ✓ Added {pending_count} cross-domain links after merge")

        print(f"[BuilderRegistry] ✓ Final graph: {len(list(merged.iter_links()))} total links")

        return merged

    @classmethod
    def available_domains(cls) -> list[str]:
        """Get list of all registered domain identifiers.

        Returns:
            Sorted list of domain names
        """
        return sorted(cls._builders.keys())

    @classmethod
    def is_registered(cls, domain: str) -> bool:
        """Check if a domain is registered.

        Args:
            domain: Domain identifier to check

        Returns:
            True if registered, False otherwise
        """
        return domain in cls._builders

    @classmethod
    def get_builder(cls, domain: str) -> Callable[..., CausalGraph] | None:
        """Get the builder function for a domain.

        Args:
            domain: Domain identifier

        Returns:
            Builder function or None if not registered
        """
        return cls._builders.get(domain)

    @classmethod
    def clear(cls) -> None:
        """Clear all registered builders (useful for testing).

        Warning: This removes ALL registered builders.
        """
        cls._builders.clear()

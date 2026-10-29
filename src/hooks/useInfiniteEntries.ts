'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Entry, Category, Tag, FilterState } from '@/types';

interface InfiniteEntriesResult {
  entries: Entry[];
  categories: Category[];
  tags: Tag[];
  total: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function useInfiniteEntries(filters: FilterState): InfiniteEntriesResult {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search ?? '');
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [filters.search]);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (!append) setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '20');

      if (debouncedSearch) params.set('search', debouncedSearch);

      if (filters.category === '__pinned__') {
        params.set('pinned', 'true');
      } else if (filters.category === '__archived__') {
        params.set('archived', 'true');
      } else if (filters.category && filters.category !== 'all') {
        params.set('category', filters.category);
      }

      if (filters.tag) params.set('tag', filters.tag);
      if (filters.type) params.set('type', filters.type);
      if (filters.sort) params.set('sort', filters.sort);

      const res = await fetch(`/api/entries?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!isMounted.current) return;

      const newEntries: Entry[] = data.entries ?? [];
      const newTotal: number = data.total ?? 0;

      if (append) {
        setEntries((prev) => [...prev, ...newEntries]);
      } else {
        setEntries(newEntries);
        setCategories(data.categories ?? []);
      }
      setTotal(newTotal);
      setHasMore(append
        ? (entries.length + newEntries.length) < newTotal
        : newEntries.length < newTotal
      );
    } catch {
      // silently handle fetch errors
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [debouncedSearch, filters.category, filters.tag, filters.type, filters.sort, entries.length]);

  // Reset and re-fetch when filters change
  useEffect(() => {
    setPage(1);
    setEntries([]);
    fetchPage(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.category, filters.tag, filters.type, filters.sort]);

  // Fetch tags separately (always non-archived)
  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.ok ? r.json() : { tags: [] })
      .then((d) => { if (isMounted.current) setTags(d.tags ?? []); })
      .catch(() => {});
  }, [entries.length]); // refresh tags when entries change

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, true);
  }, [loading, hasMore, page, fetchPage]);

  const refresh = useCallback(() => {
    setPage(1);
    setEntries([]);
    fetchPage(1, false);
  }, [fetchPage]);

  return { entries, categories, tags, total, loading, hasMore, loadMore, refresh };
}

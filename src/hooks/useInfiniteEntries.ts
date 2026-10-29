'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Entry, Category, Tag, FilterState } from '@/types';

interface InfiniteEntriesResult {
  entries: Entry[];
  categories: Category[];
  tags: Tag[];
  total: number;
  loading: boolean;
  isRefetching: boolean;
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
  const [isRefetching, setIsRefetching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [tagsNonce, setTagsNonce] = useState(0);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
  const isMounted = useRef(true);
  const fetchGenRef = useRef(0); // generation counter to discard stale responses
  const isFirstLoad = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(filters.search ?? ''), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [filters.search]);

  const buildUrl = useCallback((pageNum: number) => {
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
    return `/api/entries?${params.toString()}`;
  }, [debouncedSearch, filters.category, filters.tag, filters.type, filters.sort]);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    const gen = ++fetchGenRef.current;
    try {
      const url = buildUrl(pageNum);
      const res = await fetch(url);
      if (!res.ok || !isMounted.current || fetchGenRef.current !== gen) return;
      const data = await res.json();
      if (!isMounted.current || fetchGenRef.current !== gen) return;

      const newEntries: Entry[] = data.entries ?? [];
      const newTotal: number = data.total ?? 0;

      if (append) {
        setEntries((prev) => {
          setHasMore((prev.length + newEntries.length) < newTotal);
          return [...prev, ...newEntries];
        });
      } else {
        setEntries(newEntries);
        setCategories(data.categories ?? []);
        setHasMore(newEntries.length < newTotal);
      }
      setTotal(newTotal);
      setTagsNonce((n) => n + 1);
    } catch {
      // silently handle
    } finally {
      if (isMounted.current && fetchGenRef.current === gen) {
        setLoading(false);
        setIsRefetching(false);
      }
    }
  }, [buildUrl]);

  // Refetch when filters change
  useEffect(() => {
    setPage(1);
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      setLoading(true);
    } else {
      // Keep existing entries visible; show thin refetch indicator
      setIsRefetching(true);
    }
    fetchPage(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.category, filters.tag, filters.type, filters.sort]);

  // Fetch tags independently to avoid circular deps
  useEffect(() => {
    if (tagsNonce === 0) return;
    fetch('/api/tags')
      .then((r) => r.ok ? r.json() : { tags: [] })
      .then((d) => { if (isMounted.current) setTags(d.tags ?? []); })
      .catch(() => {});
  }, [tagsNonce]);

  const loadMore = useCallback(() => {
    if (loading || isRefetching || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, true);
  }, [loading, isRefetching, hasMore, page, fetchPage]);

  const refresh = useCallback(() => {
    setPage(1);
    setIsRefetching(true);
    fetchPage(1, false);
  }, [fetchPage]);

  return { entries, categories, tags, total, loading, isRefetching, hasMore, loadMore, refresh };
}

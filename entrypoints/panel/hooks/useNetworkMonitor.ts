import { useState, useEffect, useRef } from 'react';
import { browser, Browser } from '#imports';
import { NetworkEntry } from '../types';
import { entryFromHar, decodeContent } from '../utils';
import { MAX_ITEMS } from '../constants';

export function useNetworkMonitor(paused: boolean) {
  const [requests, setRequests] = useState<NetworkEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const devtoolsApi =
    browser?.devtools ?? (globalThis as typeof globalThis & { chrome?: any }).chrome?.devtools;
  
  // Computed property for backward compatibility (primary selection)
  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;

  // Helper for backward compatibility inside the hook
  const setSelectedId = (id: string | null) => {
    if (id === null) {
      setSelectedIds([]);
    } else {
      setSelectedIds([id]);
    }
  };

  const idRef = useRef(0);
  const pausedRef = useRef(paused);
  const selectedRef = useRef(selectedIds);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    selectedRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    // Check if running in a context where devtools API is available
    if (!devtoolsApi?.network) return;

    const handleRequestFinished = (request: Browser.devtools.network.Request) => {
      if (pausedRef.current) return;
      const id = `req-${Date.now()}-${++idRef.current}`;
      const entry = entryFromHar(request, id);

      setRequests((prev) => {
        const nextSeq = ((prev[0]?.sequence) ?? 0) + 1;
        entry.sequence = nextSeq;
        return [entry, ...prev].slice(0, MAX_ITEMS);
      });

      request.getContent((content, encoding) => {
        if (!content) return;
        const decoded = decodeContent(content, encoding);
        setRequests((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  responseBody: decoded || item.responseBody,
                  responseEncoding: encoding || item.responseEncoding,
                }
              : item,
          ),
        );
      });
    };

    const handleNavigated = () => {
      setRequests([]);
      setSelectedId(null);
    };

    devtoolsApi.network.onRequestFinished.addListener(handleRequestFinished);
    devtoolsApi.network.onNavigated.addListener(handleNavigated);

    devtoolsApi.network.getHAR((harLog) => {
      const entries = harLog?.entries ?? [];
      if (!entries.length) return;
      const seed = entries
        .slice(-MAX_ITEMS)
        .map((entry, index) =>
          entryFromHar(entry, `har-${Date.now()}-${index}`),
        )
        .reverse();
      setRequests(seed);
      // Logic for initial selection if needed
      if ((!selectedRef.current || selectedRef.current.length === 0) && seed.length) {
         setSelectedId(seed[0].id);
      }
    });

    return () => {
      devtoolsApi.network.onRequestFinished.removeListener(handleRequestFinished);
      devtoolsApi.network.onNavigated.removeListener(handleNavigated);
    };
  }, []); // Run once on mount

  // Ensure selection validity when requests change
  useEffect(() => {
    if (!requests.length) {
      if (selectedId) setSelectedId(null);
      return;
    }

    if (selectedId && !requests.some((entry) => entry.id === selectedId)) {
        // If the selected ID is no longer in the list
         setSelectedId(requests[0].id);
    } else if (!selectedId && requests.length > 0) {
        // If nothing is selected, select the first one.
        setSelectedId(requests[0].id);
    }
  }, [requests]); // Removed selectedId to avoid circular dependency/excessive updates if logic is right

  return {
    requests,
    setRequests,
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
  };
}

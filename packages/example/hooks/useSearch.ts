import { useCallback, useEffect, useState } from 'react';

export default function useSearch(
  contentRef: React.RefObject<HTMLDivElement>,
  searchClass = '.searchable',
) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [matches, setMatches] = useState<Element[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const clearHighlights = useCallback(() => {
    if (contentRef.current) {
      const headers = contentRef.current.querySelectorAll(searchClass);
      headers.forEach((header) => {
        (header as HTMLElement).style.backgroundColor = 'transparent';
      });
    }
  }, [contentRef, searchClass]);

  const search = useCallback(() => {
    clearHighlights();
    if (!searchTerm || !contentRef.current) {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }

    const headers = Array.from(contentRef.current.querySelectorAll(searchClass));
    const regex = new RegExp(searchTerm, 'i');
    const newMatches = headers.filter((header) => regex.test(header.textContent || ''));

    setMatches(newMatches);
    setCurrentIndex(newMatches.length > 0 ? 0 : -1);
  }, [clearHighlights, searchTerm, contentRef, searchClass]);

  const highlightMatch = useCallback(
    (index: number) => {
      matches.forEach((match, idx) => {
        const element = match as HTMLElement;
        element.style.backgroundColor = idx === index ? 'yellow' : '#eddab43f';
      });

      if (index >= 0 && index < matches.length) {
        matches[index].scrollIntoView({ behavior: 'smooth' });
      }
    },
    [matches],
  );

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;
    const nextIndex = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIndex);
  }, [matches, currentIndex]);

  useEffect(() => {
    search();
  }, [search]);

  useEffect(() => {
    highlightMatch(currentIndex);
  }, [highlightMatch, currentIndex]);

  return {
    searchTerm,
    setSearchTerm,
    matches,
    currentIndex,
    nextMatch,
  };
}

"use client";

import { useState, useEffect } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    debounceMs?: number;
}

const SearchBar = ({ onSearch, placeholder = "Search...", debounceMs = 300 }: SearchBarProps) => {
    const [query, setQuery] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            onSearch(query);
        }, debounceMs);

        return () => {
            clearTimeout(handler);
        };
    }, [query, debounceMs, onSearch]);

    return (
        <div className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="border border-border rounded px-3 py-1.5 text-sm text-foreground bg-background placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pl-8 transition-colors duration-300"
            />
            <span className="absolute left-2.5 top-1.5 text-gray-400">
                <i className="fas fa-search"></i>
            </span>
        </div>
    );
};

export default SearchBar;

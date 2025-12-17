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
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pl-8"
            />
            <span className="absolute left-2.5 top-1.5 text-gray-400">
                <i className="fas fa-search"></i>
            </span>
        </div>
    );
};

export default SearchBar;

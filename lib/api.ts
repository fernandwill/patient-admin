/**
 * A wrapper around the native fetch API that automatically includes
 * the required API Key for our secured backend routes.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    if (!apiKey) {
        console.warn("NEXT_PUBLIC_API_KEY is not defined in your environment variables.");
    }

    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
        'x-api-key': apiKey || '',
    };

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const mergedOptions = {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    };

    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
        console.error("API Authorization failed. Check your NEXT_PUBLIC_API_KEY.");
    }

    return response;
}

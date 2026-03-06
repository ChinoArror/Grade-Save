export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('sso_token');
    const headers = {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    };
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth');
        localStorage.removeItem('sso_token');
        window.location.href = '/login';
    }

    return response;
};

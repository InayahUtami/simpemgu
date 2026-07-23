// Utility function untuk fetch dengan header ngrok
export const fetchWithNgrokHeader = (url: string, options?: RequestInit) => {
  const headers = {
    ...(options?.headers || {}),
    'ngrok-skip-browser-warning': 'true',
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};


const API_BASE = "http://localhost:8000/api/v1";

export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
        let errDetail = "An error occurred";
        try {
            const errData = await res.json();
            if (errData.detail) {
                errDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
            }
        } catch (e) {}
        throw new Error(errDetail);
    }
    return res.json();
  },

  async post<T>(path: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        let errDetail = "An error occurred";
        try {
            const errData = await res.json();
            if (errData.detail) {
                errDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
            }
        } catch (e) {}
        throw new Error(errDetail);
    }
    return res.json();
  },

  async put<T>(path: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        let errDetail = "An error occurred";
        try {
            const errData = await res.json();
            if (errData.detail) {
                errDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
            }
        } catch (e) {}
        throw new Error(errDetail);
    }
    return res.json();
  },

  async delete(path: string): Promise<void> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "DELETE"
    });
    if (!res.ok) {
        let errDetail = "An error occurred";
        try {
            const errData = await res.json();
            if (errData.detail) {
                errDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
            }
        } catch (e) {}
        throw new Error(errDetail);
    }
  }
};

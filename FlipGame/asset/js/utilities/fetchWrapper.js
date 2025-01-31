export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE'),
    difyPost:difyRequest("Post"),
    difyGet:difyRequest("GET"),
    upload: uploadFromForm
};

function handleResponse(response) {
    return response.text().then((text) => {
        const data = text && JSON.parse(text);

        if (!response.ok) {
            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}

function request(method) {
    return (url, body) => {
        const requestOptions = {
            method,
            headers: {}
        };
        if (body) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(body);
        }
        return fetch(url, requestOptions).then(handleResponse);
    };
}

function uploadFromForm(url, formData) {
    const requestOptions = {
        method: 'POST',
        body: formData
    };
    return fetch(url, requestOptions).then(handleResponse);
}

function difyRequest(method) {
    return (url, body) => {
        const requestOptions = {
            method,
            headers: {
                "Authorization":"Bearer app-tMZyRksMdiOAHS8ASPPkrwJI"
            }
        };
        if (body) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(body);
        }
        return fetch(url, requestOptions);
    };
}

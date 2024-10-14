import { API_ROUTES } from '../routes/difyComfyUIRoutes.js';
import { fetchWrapper } from '../asset/js/utilities/fetchWrapper.js';

export const DifyComfyUIService = {
    getComfyFluxImage(body) {
        return fetchWrapper.difyPost(`${API_ROUTES.COMFY_UI_Flux_Chat}`, body);
    },
    getComfyFluxImageMsg(conversationId) {
        return fetchWrapper.difyGet(`${API_ROUTES.COMFY_UI_Flux_MSG + conversationId}  `);
    },
};

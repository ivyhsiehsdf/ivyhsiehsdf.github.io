const API_BASE_URL = 'https://dify-line-chat.azurewebsites.net';

export const API_ROUTES = {
    UPLOAD_STYLE_CHANGE_IMAGE: `${API_BASE_URL}/api/comfyui/uploadImageByFile`,
    GET_PUBLIC_IMAGE_URL: `${API_BASE_URL}/api/comfyui/GetInputUploadImageUrl`,
    CREATE_STYLE_SWAP_IMAGE: `${API_BASE_URL}/api/StyleSwap/CreateStyleChangeImageByPrompt`,
    GET_STYLE_SWAP_IMAGE: `${API_BASE_URL}/api/StyleSwap/GetStyleChangeImageByPromptId`,
};
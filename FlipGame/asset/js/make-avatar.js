import { ComfyUIService } from '../../service/comfyUIService.js';
import { retryWithDelay } from '../js/utilities/retryWithDelay.js';
const promptOptions = [
    {
        label: 'Pop Art Style (Andy Warhol)',
        value: 'Convert the portrait into a Pop Art masterpiece in the style of Andy Warhol. Use bold, flat colors, strong outlines, and repetitive patterns. Incorporate vibrant, contrasting hues and a screen-printed aesthetic.'
    },
    {
        label: 'Byzantine Mosaic Style',
        value: 'Convert the portrait into a Pop Art masterpiece in the style of Andy Warhol. Use bold, flat colors, strong outlines, and repetitive patterns. Incorporate vibrant, contrasting hues and a screen-printed aesthetic.'
    },
    {
        label: 'Impressionist Style (Claude Monet)',
        value: 'Transform the portrait into an Impressionist masterpiece in the style of Claude Monet. Use short, thick strokes of paint to capture the essence of the subject rather than the details. Incorporate vibrant colors and a sense of movement.'
    },
    {
        label: 'Cubist Style (Pablo Picasso)',
        value: 'Transform the portrait into a Cubist masterpiece in the style of Pablo Picasso. Use geometric shapes, overlapping planes, and multiple perspectives to create an abstract representation of the subject. Incorporate bold colors and a fractured composition.'
    },
    {
        label: 'Surrealist Style (Salvador Dali)',
        value: 'Transform the portrait into a Surrealist masterpiece in the style of Salvador Dali. Use dreamlike imagery, unexpected juxtapositions, and distorted forms to create a surreal and imaginative interpretation of the subject. Incorporate symbolic elements and a sense of mystery.'
    }
];
const { createApp } = Vue;

const vue = createApp({
    data() {
        return {
            width: 630,
            height: 630,
            seed: 1,
            styleSelect: "Select Style Prompt",
            stylePrompt: "",
            stylePromptOptions: [],
            sourceImageName: "",
            originalImageUrl: "",
            changedImageUrl: "",
            isClickChangeStyleBtn: false,
            promptId: null,
            getPromptResultState: false,
            isLoading: false
        }
    },
    created() {
        this.init()
    },
    watch: {
        styleSelect(val) {
            this.stylePrompt = this.stylePromptOptions.find(x => x.label === val).value
        }
    },
    computed: {
        isEnabledChangeStyleBtn() {
            return !(this.width > 0 && this.height > 0 && this.seed > 0 && this.stylePrompt != "" && this.originalImageUrl !== "")
        }
    },
    methods: {
        init() {
            const defaultList = [{
                label: 'Select Style Prompt',
                value: ''
            }]
            this.stylePromptOptions = defaultList.concat(promptOptions)
        },
        formLoading() {
            this.isLoading = true
        },
        formLoaded() {
            this.isLoading = false
        },
        async uploadImages(event) {
            this.formLoading()
            const file = event.target.files[0];
            try {
                const uploadResult = await ComfyUIService.uploadStyleChangeImage(file);
                this.sourceImageName = uploadResult.name;
                const sourceImageUrlResult = await ComfyUIService.getPublicImageUrl(this.sourceImageName);
                this.originalImageUrl = sourceImageUrlResult.publicUrl;
                this.toastShow(true, '圖片上傳成功')
            } catch (error) {
                console.error(error);
                this.toastShow(false, '圖片上傳失敗')
            } finally {
                this.formLoaded()
            }
        },
        async changeStyle() {
            this.formLoading()
            this.isClickChangeStyleBtn = true;
            this.changedImageUrl = ""
            this.createFurnitureDesign()
        },
        async createFurnitureDesign() {
            const body = {
                image_name: this.sourceImageName,
                style: this.stylePrompt,
                seed: this.seed,
                width: this.width,
                height: this.height
            };
            try {
                const result = await ComfyUIService.createStyleSwapImage(body);
                this.promptId = result.body.prompt_id;
                this.getPromptResultState = true;
                this.toastShow(true, result.message)

            } catch (error) {
                console.error(error);
                this.toastShow(false, '圖片建立失敗')
            } finally {
                this.isClickChangeStyleBtn = false
                this.formLoaded()
            }
        },
        toastShow(isSuccess, mag) {
            let styleObj = {}
            if (isSuccess) {
                styleObj = {
                    background: "rgb(5 150 105)",

                }
            } else {
                styleObj = {
                    background: "rgb(190 18 60)",
                }
            }
            Toastify({
                text: mag,
                duration: 3000,
                newWindow: true,
                close: false,
                gravity: "top", // `top` or `bottom`
                position: "right", // `left`, `center` or `right`
                stopOnFocus: true, // Prevents dismissing of toast on hover
                style: styleObj
            }).showToast();
        },
        async getPromptResult() {
            try {
                this.formLoading()
                this.isClickChangeStyleBtn = true;
                const result = await retryWithDelay(
                    async () => {
                        const response = await ComfyUIService.getSwapStyleImage(this.promptId);
                        if (response.body.is_success !== true) {
                            throw new Error('Result not ready');
                        }
                        return response;
                    },
                    {
                        maxRetries: 5,
                        delay: 5000,
                        onRetry: (retryCount) => {
                            this.toastShow(false, `嘗試第 ${retryCount} 次失敗。將在 ${5000 / 1000} 秒後重新嘗試`)

                        }
                    }
                );
                this.changedImageUrl = result.body.public_url;
                this.getPromptResultState = false;
                this.toastShow(true, '取得結果成功')
                this.formLoaded()

            } catch (error) {
                console.error(error);
                this.toastShow(false, '取得結果失敗')
                this.formLoaded()
            } finally {
                
                this.isClickChangeStyleBtn = false;

            }
        }
    },
})
vue.mount("#app");
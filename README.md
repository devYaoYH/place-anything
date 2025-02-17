# Place Anything

Insert objects and position them into scenery before sprinkling some genAI magic to merge them together!

WebUI preview here: https://devyaoyh.github.io/place-anything/

**However, You'll need to start your own server for the AI magic to work though... Automatic1111 webui with `--api` option enabled is what's used here. sd-1.5-inpainting model is used for generation.**

sd-1.5 isn't that great, so the best results appear when the background is rather simple without many details.

## Automatic1111 Setup

Setting up to run stable diffusion on your local machine takes a bit of effort:

1. Download webui here: https://github.com/AUTOMATIC1111/stable-diffusion-webui
2. Ensure python version is 3.10 (no more, no less apparently...)
3. Run `./webui.sh` for macOS or follow instructions here: https://github.com/AUTOMATIC1111/stable-diffusion-webui?tab=readme-ov-file#installation-and-running
4. Start the server by running `./webui.sh --api` again in the terminal after initial setup
5. Download a copy of the model weights for one of the stable diffusion models: https://huggingface.co/stabilityai. I used:
    - [3.5 medium](https://huggingface.co/stabilityai/stable-diffusion-3.5-medium) (but it had poor inpainting generation)
    - [1.5 inpainting](https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-inpainting)
    - You want to look for the 'files and versions' tab to download the '.safetensors' or '.ckpt' files
6. Move the downloaded model weights into webui's `/models/Stable-diffusion/` folder

### SAM Setup

Getting the image segmentation to work requires one to install an additional extension to Automatic1111:

1. Open the webui's `extensions` tab and the `install from url` subtab.
2. Paste link to the extension github repo (https://github.com/continue-revolution/sd-webui-segment-anything) and click install.
3. You'll have to go back to the `installed` subtab and restart to enable the extension.
4. Download a SAM model from: https://github.com/continue-revolution/sd-webui-segment-anything?tab=readme-ov-file#installation
5. Move the model weights into the `/models/sam` folder which should be in the webui `extensions` folder.

## Brief tech details

Merging done in 2 steps:

1. Extract objects without background --> convert into image mask
2. Use mask to outpaint with low denoising strength to preserve original elements of the background

## Technologies used

- Automatic1111 with API
    - sd-1.5-inpainting for outpainting
    - SAM for initial background removal
- Windsurf IDE for lightning fast development
    - the entire project was completed in ~6hr by a single dev (me!)

# Future Extensions

- Add CnotrolNet support in generation process to better recreate surrounding background scene: https://github.com/lllyasviel/ControlNet

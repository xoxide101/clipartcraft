// In-browser AI models (Transformers.js + ONNX Runtime Web), bundled into one classic script so it works from file://.
// ClipArtCraft loads this file only when pictures are first named by what is in them (CLIP: picture and text models).
import { env, RawImage, AutoProcessor, AutoTokenizer, CLIPVisionModelWithProjection, CLIPTextModelWithProjection } from '@huggingface/transformers';
window.CraftTF = { env, RawImage, AutoProcessor, AutoTokenizer, CLIPVisionModelWithProjection, CLIPTextModelWithProjection };

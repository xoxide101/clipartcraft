// In-browser AI models (Transformers.js + ONNX Runtime Web), bundled into one classic script so it works from file://.
// ClipArtCraft loads this file only when an AI tool is first used: CLIP (picture and text models, to match a picture
// with words) and Florence-2 (to describe a picture in a sentence) to name pictures; the cut-out (background removal)
// and repair (MI-GAN, filling in missing parts) for Touch up. ort (the same runtime Transformers.js uses) runs models
// that have no ready-made pipeline.
import { env, pipeline, RawImage, AutoModel, AutoProcessor, SamModel, Tensor, AutoTokenizer, CLIPVisionModelWithProjection, CLIPTextModelWithProjection, Florence2ForConditionalGeneration } from '@huggingface/transformers';
import * as ort from 'onnxruntime-web';
window.CraftTF = { env, pipeline, RawImage, AutoModel, AutoProcessor, SamModel, Tensor, AutoTokenizer, CLIPVisionModelWithProjection, CLIPTextModelWithProjection, Florence2ForConditionalGeneration, ort };

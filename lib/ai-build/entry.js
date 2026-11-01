// In-browser AI models (Transformers.js + ONNX Runtime Web), bundled into one classic script so it works from file://.
// ClipArtCraft loads this file only when pictures are first named by what is in them: CLIP (picture and text models,
// to match a picture with words) and Florence-2 (to describe a picture in a sentence).
import { env, RawImage, AutoProcessor, AutoTokenizer, CLIPVisionModelWithProjection, CLIPTextModelWithProjection, Florence2ForConditionalGeneration } from '@huggingface/transformers';
window.CraftTF = { env, RawImage, AutoProcessor, AutoTokenizer, CLIPVisionModelWithProjection, CLIPTextModelWithProjection, Florence2ForConditionalGeneration };

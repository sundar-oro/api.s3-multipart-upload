import { Hono } from "hono";
import { MultipartUploadController } from "../controllers/multipartUploadController";

const multipartUploadController = new MultipartUploadController();
export const multiPart = new Hono();

multiPart.post("/start", multipartUploadController.initializeMultipartUpload.bind(multipartUploadController));

multiPart.post("/urls", multipartUploadController.getMultipartUploadUrls.bind(multipartUploadController));

multiPart.post("/complete", multipartUploadController.completeMultipartUpload.bind(multipartUploadController));

multiPart.post("/abort", multipartUploadController.abortMultipartUpload.bind(multipartUploadController));

multiPart.post("/list-incomplete-parts", multipartUploadController.listIncompleteParts.bind(multipartUploadController))
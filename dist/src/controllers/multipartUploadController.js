"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipartUploadController = void 0;
const filenameHelper_1 = require("../helpers/filenameHelper");
const multipartUploadService_1 = require("../services/multipartUploadService");
const reponseHelper_1 = require("../helpers/reponseHelper");
const appMessages_1 = require("../constants/appMessages");
const validationHelper_1 = require("../helpers/validationHelper");
const uploadFileData_1 = require("../validations/uploadFileData");
const getUrlsData_1 = require("../validations/getUrlsData");
const completeUploadData_1 = require("../validations/completeUploadData");
const abortUpload_1 = require("../validations/abortUpload");
const multipartUploadService = new multipartUploadService_1.MultipartUploadService();
class MultipartUploadController {
    async initializeMultipartUpload(c) {
        try {
            const reqData = await c.req.json();
            const validatedData = await (0, validationHelper_1.default)(uploadFileData_1.uploadFileData, reqData);
            const fileName = await (0, filenameHelper_1.fileNameHelper)(validatedData);
            const slug = 'mult-part-uploads';
            const uploadedData = await multipartUploadService.initializeMultipartUpload(slug, fileName);
            const response = {
                file_type: reqData.file_type,
                original_name: reqData.original_name,
                upload_id: uploadedData.UploadId,
                key: fileName,
                file_key: `${slug}/` + fileName,
            };
            return (0, reponseHelper_1.sendSuccessResponse)(c, 200, appMessages_1.MULTIPART_UPLOAD_START, response);
        }
        catch (error) {
            throw error;
        }
    }
    async getMultipartUploadUrls(c) {
        try {
            const reqData = await c.req.json();
            const validatedData = await (0, validationHelper_1.default)(getUrlsData_1.getUrlsData, reqData);
            const uploadUrls = await multipartUploadService.multipartPresignedUrl(validatedData.file_key, validatedData.parts, validatedData.upload_id);
            return (0, reponseHelper_1.sendSuccessResponse)(c, 200, appMessages_1.MULTIPART_UPLOAD_URLS, uploadUrls);
        }
        catch (error) {
            throw error;
        }
    }
    async completeMultipartUpload(c) {
        try {
            const reqData = await c.req.json();
            const validatedData = await (0, validationHelper_1.default)(completeUploadData_1.completeUploadData, reqData);
            await multipartUploadService.completeMultipartUpload(validatedData.file_key, validatedData.upload_id, validatedData.parts);
            return (0, reponseHelper_1.sendSuccessResponse)(c, 200, appMessages_1.MULTIPART_UPLOAD_SUCCESS);
        }
        catch (error) {
            throw error;
        }
    }
    async abortMultipartUpload(c) {
        try {
            const reqData = await c.req.json();
            const validatedData = await (0, validationHelper_1.default)(abortUpload_1.abortUploadData, reqData);
            await multipartUploadService.abortMultipartUpload(validatedData.file_key, validatedData.upload_id);
            return (0, reponseHelper_1.sendSuccessResponse)(c, 200, appMessages_1.MULTIPART_UPLOAD_ABORTED);
        }
        catch (error) {
            throw error;
        }
    }
    async listIncompleteParts(c) {
        try {
            const reqData = await c.req.json();
            const validatedData = await (0, validationHelper_1.default)(getUrlsData_1.getUrlsData, reqData);
            const incompleteUploads = await multipartUploadService.listIncompleteParts(validatedData.file_key, validatedData.upload_id, validatedData.parts);
            return (0, reponseHelper_1.sendSuccessResponse)(c, 200, appMessages_1.FETCHED_INCOMPLETE_PARTS, incompleteUploads);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.MultipartUploadController = MultipartUploadController;

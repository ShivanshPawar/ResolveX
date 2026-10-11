import multer from 'multer'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const maxFileSize = 5 * 1024 * 1024

const storage = multer.memoryStorage()

export const issueImagesUpload = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only jpeg/jpg/png/webp formats are allowed'))
    }
    return cb(null, true)
  },
})

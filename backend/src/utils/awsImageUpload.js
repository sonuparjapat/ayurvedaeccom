const {
  PutObjectCommand,
  DeleteObjectCommand
} = require(
  "@aws-sdk/client-s3"
)

const axios =
require("axios")

const {
  s3
} = require(
  "../config/aws"
)

const path =
require("path")

const BUCKET =
process.env.AWS_BUCKET_NAME

const REGION =
process.env.AWS_REGION

function buildAwsUrl(key) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
}

/* core uploader */
async function uploadBufferToAWS(
  buffer,
  key,
  mimeType =
    "application/octet-stream"
) {

  if (!buffer) {
    throw new Error(
      "Buffer missing"
    )
  }

  const command =
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType:
        mimeType
    })

  await s3.send(command)

  return buildAwsUrl(key)
}

/* temp files */
exports.uploadTempFileToAWS =
async function (
  buffer,
  fileName,
  mimeType
) {

  return await uploadBufferToAWS(
    buffer,
    `bulk-temp/${fileName}`,
    mimeType
  )
}

/* download any file */
exports.downloadFileFromUrl =
async function (url) {

  const res =
    await axios.get(url,{
      responseType:
        "arraybuffer",
      timeout:15000,
      maxContentLength:
        50 * 1024 * 1024
    })

  return Buffer.from(
    res.data
  )
}

/* upload product image */
exports.uploadImageToAWS =
async function (
  file,
  folder = "products"
) {

  try {

    if (
      !file ||
      !file.buffer
    ) {
      throw new Error(
        "File buffer missing"
      )
    }

    const ext =
      path.extname(
        file.originalname ||
        "image.jpg"
      ) || ".jpg"

    const safeFolder =
      folder || "products"

    const key =
      `${safeFolder}/` +
      Date.now() +
      "-" +
      Math.round(
        Math.random() * 1e9
      ) +
      ext

    return await uploadBufferToAWS(
      file.buffer,
      key,
      file.mimetype ||
      "image/jpeg"
    )

  } catch (err) {

    console.error(
      "AWS Upload Error:",
      err.message
    )

    throw err
  }
}

/* delete any AWS file */
exports.deleteFromAWS =
async function (url) {

  try {

    if (!url) return

    const key =
      new URL(url)
      .pathname
      .slice(1)

    if (!key) return

    const command =
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
      })

    await s3.send(command)

  } catch (err) {

    console.log(
      "AWS Delete Error:",
      err.message
    )
  }
}

/* upload image from external URL */
exports.uploadImageFromUrl =
async function (
  imageUrl,
  folder = "products"
) {

  try {

    const response =
      await axios.get(
        imageUrl,
        {
          responseType:
            "arraybuffer",
          timeout:15000,
          maxContentLength:
            20 * 1024 * 1024
        }
      )

    const ext =
      path.extname(
        imageUrl.split("?")[0]
      ) || ".jpg"

    const fakeFile = {
      buffer:
        Buffer.from(
          response.data
        ),
      originalname:
        `remote${ext}`,
      mimetype:
        response.headers[
          "content-type"
        ] ||
        "image/jpeg"
    }

    return await exports
      .uploadImageToAWS(
        fakeFile,
        folder
      )

  } catch (err) {

    throw new Error(
      "Failed to fetch image URL"
    )
  }
}
import imageKit from "../config/imagekit.js";

export async function uploadIssueImage({ file, issueId, userId }) {
  const folder = `/resolvex/issues/${issueId}`;
  const fileName = `${Date.now()}-${userId}-${file.originalname.replace(/\s+/g, "-")}`;

  const uploaded = await imageKit.upload({
    file: file.buffer,
    fileName,
    folder,
    useUniqueFileName: true,
    tags: ["resolvex", "issue-image"],
  });

  return {
    url: uploaded.url,
    fileId: uploaded.fileId,
    thumbnailUrl: imageKit.url({
      src: uploaded.url,
      transformation: [{ width: 320, height: 220, crop: "at_max" }],
    }),
    name: uploaded.name,
    size: uploaded.size || 0,
  };
}

export async function deleteImageByFileId(fileId) {
  return imageKit.deleteFile(fileId);
}

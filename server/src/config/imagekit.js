import ImageKit from "imagekit";
import env from "./env.js";

const imageKit = new ImageKit({
  publicKey: env.imagekitPublicKey,
  privateKey: env.imagekitPrivateKey,
  urlEndpoint: env.imagekitUrlEndpoint,
});

export default imageKit;

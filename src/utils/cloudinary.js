import {v2 as cloudinary} from "cloudinary"
import fs from "fs"



          
cloudinary.config({ 
  cloud_name: 'sohailarain', 
  api_key: '341199884238858', 
  api_secret: '3801qC7dEnP2dalcE8aXgdN8A8k' 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        }) 
       
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
          // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export { uploadOnCloudinary }
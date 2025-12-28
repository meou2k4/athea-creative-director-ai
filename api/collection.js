import { google } from 'googleapis';
import { Readable } from 'stream';

// --- CẤU HÌNH OAUTH2 ---
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
} else {
  console.error("⚠️ CẢNH BÁO: Thiếu GOOGLE_REFRESH_TOKEN trong ENV");
}

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// --- HÀM HELPER: LƯU BASE64 THÀNH FILE DRIVE ---
async function saveBase64AsFile(base64Str, folderId, fileName, existingFileId = null) {
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const stream = Readable.from(buffer);

    if (existingFileId) {
      await drive.files.update({
        fileId: existingFileId,
        media: { mimeType: mimeType, body: stream },
        fields: 'id'
      });
      console.log(`✅ Đã cập nhật ảnh: ${fileName} (${existingFileId})`);
      return `DRIVE_FILE:${existingFileId}`;
    } else {
      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };
      const media = {
        mimeType: mimeType,
        body: stream
      };

      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      });
      
      console.log(`✅ Đã tách ảnh lưu thành file: ${fileName} (${file.data.id})`);
      return `DRIVE_FILE:${file.data.id}`;
    }
  } catch (error) {
    console.error("Lỗi lưu ảnh:", error.message);
    return null; 
  }
}

// --- HÀM HELPER: TẢI ẢNH TỪ DRIVE VỀ BASE64 ---
async function restoreImageFromDrive(strValue) {
  if (!strValue || typeof strValue !== 'string' || !strValue.startsWith('DRIVE_FILE:')) {
    return strValue;
  }
  
  const fileId = strValue.replace('DRIVE_FILE:', '');
  try {
    const [meta, response] = await Promise.all([
      drive.files.get({ fileId, fields: 'mimeType' }),
      drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
    ]);
    
    const mimeType = meta.data.mimeType || 'image/png';
    const base64 = Buffer.from(response.data).toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (e) {
    console.error(`Không thể tải ảnh ${fileId}:`, e.message);
    return null;
  }
}

// --- HÀM TÌM FOLDER USER ---
async function getUserFolderId(userId) {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${userId}' and '${rootFolderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });
  if (res.data.files?.length > 0) return res.data.files[0].id;
  
  const file = await drive.files.create({
    resource: { name: userId, mimeType: 'application/vnd.google-apps.folder', parents: [rootFolderId] },
    fields: 'id',
  });
  return file.data.id;
}

// --- VERCEL SERVERLESS FUNCTION ---
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, userId, conceptData, conceptId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu User ID' });
    }
    
    const userFolderId = await getUserFolderId(userId);

    // --- XỬ LÝ LƯU (SAVE) - POST ---
    if (req.method === 'POST' && action === 'save') {
      console.log("📥 Đang xử lý lưu Concept...");
      
      let existingFileList = await drive.files.list({ 
        q: `'${userFolderId}' in parents and mimeType='application/json' and name='concept_${conceptId}.json' and trashed=false`, 
        fields: 'files(id)' 
      });
      
      if (!existingFileList.data.files || existingFileList.data.files.length === 0) {
        const conceptName = conceptData.concept_name_vn || conceptData.concept_name_en || '';
        if (conceptName) {
          const allConcepts = await drive.files.list({ 
            q: `'${userFolderId}' in parents and mimeType='application/json' and trashed=false`, 
            fields: 'files(id, name)' 
          });
          
          for (const file of allConcepts.data.files || []) {
            try {
              const content = await drive.files.get({ fileId: file.id, alt: 'media' });
              const data = typeof content.data === 'string' ? JSON.parse(content.data) : content.data;
              if ((data.concept_name_vn === conceptData.concept_name_vn && data.concept_name_vn) ||
                  (data.concept_name_en === conceptData.concept_name_en && data.concept_name_en)) {
                existingFileList = { data: { files: [{ id: file.id }] } };
                console.log(`🔄 Tìm thấy concept cùng tên, sẽ update: ${file.name}`);
                break;
              }
            } catch (e) {
              // Bỏ qua file lỗi
            }
          }
        }
      }
      
      const isUpdate = existingFileList.data.files && existingFileList.data.files.length > 0;
      let existingData = null;
      
      if (isUpdate) {
        console.log("🔄 Concept đã tồn tại, đang cập nhật...");
        try {
          const existingFileId = existingFileList.data.files[0].id;
          const existingContent = await drive.files.get({ fileId: existingFileId, alt: 'media' });
          existingData = typeof existingContent.data === 'string' ? JSON.parse(existingContent.data) : existingContent.data;
        } catch (e) {
          console.warn("Không thể đọc dữ liệu cũ, sẽ tạo mới:", e.message);
        }
      }
      
      const cleanData = { ...conceptData };
      
      // 1. Tách ảnh kết quả từ poses
      if (cleanData.poses && Array.isArray(cleanData.poses)) {
        for (let poseIdx = 0; poseIdx < cleanData.poses.length; poseIdx++) {
          const pose = cleanData.poses[poseIdx];
          if (pose.generated_image) {
            const isBase64 = typeof pose.generated_image === 'string' && 
                            (pose.generated_image.startsWith('data:') || pose.generated_image.length > 1000);
            
            if (isUpdate && existingData?.poses?.[poseIdx]?.generated_image?.startsWith('DRIVE_FILE:')) {
              if (isBase64) {
                const existingFileId = existingData.poses[poseIdx].generated_image.replace('DRIVE_FILE:', '');
                pose.generated_image = await saveBase64AsFile(
                  pose.generated_image, 
                  userFolderId, 
                  `pose_${conceptId}_${poseIdx + 1}.png`,
                  existingFileId
                );
              } else {
                pose.generated_image = existingData.poses[poseIdx].generated_image;
              }
            } else if (isBase64) {
              pose.generated_image = await saveBase64AsFile(
                pose.generated_image, 
                userFolderId, 
                `pose_${conceptId}_${poseIdx + 1}.png`
              );
            }
          }
        }
      }

      // 2. Tách ảnh gốc (Product Images)
      if (cleanData.input && cleanData.input.productImages) {
        const newProducts = [];
        let idx = 0;
        for (const img of cleanData.input.productImages) {
          idx++;
          if (img.data) {
            const isBase64 = typeof img.data === 'string' && 
                            (img.data.startsWith('data:') || img.data.length > 1000);
            
            if (isUpdate && existingData?.input?.productImages?.[idx - 1]?.data?.startsWith('DRIVE_FILE:')) {
              if (isBase64) {
                const existingFileId = existingData.input.productImages[idx - 1].data.replace('DRIVE_FILE:', '');
                const newId = await saveBase64AsFile(img.data, userFolderId, `input_${conceptId}_${idx}.png`, existingFileId);
                newProducts.push({ ...img, data: newId });
              } else {
                newProducts.push(existingData.input.productImages[idx - 1]);
              }
            } else if (isBase64) {
              const newId = await saveBase64AsFile(img.data, userFolderId, `input_${conceptId}_${idx}.png`);
              newProducts.push({ ...img, data: newId }); 
            } else {
              newProducts.push(img);
            }
          } else {
            newProducts.push(img);
          }
        }
        cleanData.input.productImages = newProducts;
      }

      // 3. Tách Face Ref & Fabric Ref
      if (cleanData.input?.faceReference?.data) {
        const isBase64 = typeof cleanData.input.faceReference.data === 'string' && 
                        (cleanData.input.faceReference.data.startsWith('data:') || cleanData.input.faceReference.data.length > 1000);
        
        if (isUpdate && existingData?.input?.faceReference?.data?.startsWith('DRIVE_FILE:')) {
          if (!isBase64) {
            cleanData.input.faceReference.data = existingData.input.faceReference.data;
          } else {
            const existingFileId = existingData.input.faceReference.data.replace('DRIVE_FILE:', '');
            cleanData.input.faceReference.data = await saveBase64AsFile(cleanData.input.faceReference.data, userFolderId, `face_${conceptId}.png`, existingFileId);
          }
        } else if (isBase64) {
          cleanData.input.faceReference.data = await saveBase64AsFile(cleanData.input.faceReference.data, userFolderId, `face_${conceptId}.png`);
        }
      }
      
      if (cleanData.input?.fabricReference?.data) {
        const isBase64 = typeof cleanData.input.fabricReference.data === 'string' && 
                        (cleanData.input.fabricReference.data.startsWith('data:') || cleanData.input.fabricReference.data.length > 1000);
        
        if (isUpdate && existingData?.input?.fabricReference?.data?.startsWith('DRIVE_FILE:')) {
          if (!isBase64) {
            cleanData.input.fabricReference.data = existingData.input.fabricReference.data;
          } else {
            const existingFileId = existingData.input.fabricReference.data.replace('DRIVE_FILE:', '');
            cleanData.input.fabricReference.data = await saveBase64AsFile(cleanData.input.fabricReference.data, userFolderId, `fabric_${conceptId}.png`, existingFileId);
          }
        } else if (isBase64) {
          cleanData.input.fabricReference.data = await saveBase64AsFile(cleanData.input.fabricReference.data, userFolderId, `fabric_${conceptId}.png`);
        }
      }

      // 4. Lưu hoặc cập nhật file JSON
      if (isUpdate && existingFileList.data.files.length > 0) {
        const existingFileId = existingFileList.data.files[0].id;
        await drive.files.update({
          fileId: existingFileId,
          resource: { name: `concept_${conceptId}.json` },
          media: { mimeType: 'application/json', body: JSON.stringify(cleanData) }
        });
        console.log("✅ Cập nhật thành công!");
        return res.json({ success: true, message: 'Đã cập nhật', isUpdate: true });
      } else {
        await drive.files.create({
          resource: { name: `concept_${conceptId || Date.now()}.json`, parents: [userFolderId] },
          media: { mimeType: 'application/json', body: JSON.stringify(cleanData) },
          fields: 'id'
        });
        console.log("✅ Lưu thành công!");
        return res.json({ success: true, message: 'Đã lưu', isUpdate: false });
      }
    }
    
    // --- XỬ LÝ TẢI (LOAD) - POST ---
    if (req.method === 'POST' && action === 'load') {
      const list = await drive.files.list({ 
        q: `'${userFolderId}' in parents and mimeType='application/json' and trashed=false`, 
        fields: 'files(id)' 
      });
      const files = list.data.files || [];
      const concepts = [];

      console.log(`📂 Đang tải ${files.length} concepts...`);

      const jsonPromises = files.map(f => 
        drive.files.get({ fileId: f.id, alt: 'media' })
          .then(content => ({ id: f.id, data: content.data }))
          .catch(e => ({ id: f.id, error: e.message }))
      );
      
      const jsonResults = await Promise.all(jsonPromises);
      
      const imagePromises = [];
      const conceptsData = [];
      
      for (const result of jsonResults) {
        if (result.error) {
          console.error("Lỗi đọc file concept:", result.id, result.error);
          continue;
        }
        
        let data = result.data;
        if (typeof data === 'string') { 
          try { data = JSON.parse(data); } catch(e) {
            console.error("Lỗi parse JSON:", result.id);
            continue;
          }
        }
        
        if (typeof data === 'object') {
          const imageTasks = [];
          
          if (data.poses && Array.isArray(data.poses)) {
            data.poses.forEach((pose, poseIdx) => {
              if (pose.generated_image && typeof pose.generated_image === 'string' && pose.generated_image.startsWith('DRIVE_FILE:')) {
                imageTasks.push(restoreImageFromDrive(pose.generated_image).then(img => ({ key: `poses.${poseIdx}.generated_image`, value: img })));
              }
            });
          }
          
          if (!data.input) {
            data.input = {
              productImages: [],
              faceReference: { data: null, mimeType: null },
              fabricReference: { data: null, mimeType: null }
            };
          }
          
          if (data.input.productImages && Array.isArray(data.input.productImages)) {
            data.input.productImages.forEach((img, idx) => {
              if (img && img.data && typeof img.data === 'string' && img.data.startsWith('DRIVE_FILE:')) {
                imageTasks.push(restoreImageFromDrive(img.data).then(restored => ({ key: `productImages.${idx}`, value: restored })));
              }
            });
          }
          
          if (data.input?.faceReference?.data && typeof data.input.faceReference.data === 'string' && data.input.faceReference.data.startsWith('DRIVE_FILE:')) {
            imageTasks.push(restoreImageFromDrive(data.input.faceReference.data).then(img => ({ key: 'faceReference', value: img })));
          }
          
          if (data.input?.fabricReference?.data && typeof data.input.fabricReference.data === 'string' && data.input.fabricReference.data.startsWith('DRIVE_FILE:')) {
            imageTasks.push(restoreImageFromDrive(data.input.fabricReference.data).then(img => ({ key: 'fabricReference', value: img })));
          }
          
          conceptsData.push({ data, imageTasks });
        }
      }
      
      const allImageTasks = [];
      const taskMapping = [];
      
      conceptsData.forEach((conceptItem, conceptIdx) => {
        conceptItem.imageTasks.forEach((task, taskIndex) => {
          taskMapping.push({ conceptIdx, taskIndex });
          allImageTasks.push(task);
        });
      });
      
      if (allImageTasks.length > 0) {
        const allResults = await Promise.all(allImageTasks);
        
        const resultsByConcept = new Map();
        allResults.forEach((result, resultIdx) => {
          const { conceptIdx } = taskMapping[resultIdx];
          if (!resultsByConcept.has(conceptIdx)) {
            resultsByConcept.set(conceptIdx, []);
          }
          resultsByConcept.get(conceptIdx).push(result);
        });
        
        conceptsData.forEach(({ data }, conceptIdx) => {
          if (resultsByConcept.has(conceptIdx)) {
            const results = resultsByConcept.get(conceptIdx);
            for (const { key, value } of results) {
              if (key.startsWith('poses.')) {
                const parts = key.split('.');
                if (parts.length === 3 && parts[2] === 'generated_image') {
                  const poseIdx = parseInt(parts[1]);
                  if (data.poses && data.poses[poseIdx]) {
                    data.poses[poseIdx].generated_image = value;
                  }
                }
              } else if (key.startsWith('productImages.')) {
                const idx = parseInt(key.split('.')[1]);
                if (!data.input) data.input = {};
                if (!data.input.productImages) data.input.productImages = [];
                while (data.input.productImages.length <= idx) {
                  data.input.productImages.push({ data: null, mimeType: null });
                }
                data.input.productImages[idx].data = value;
                if (data.input.productImages[idx].mimeType === null && value && value.startsWith('data:')) {
                  const mimeMatch = value.match(/^data:([^;]+)/);
                  if (mimeMatch) {
                    data.input.productImages[idx].mimeType = mimeMatch[1];
                  }
                }
              } else if (key === 'faceReference') {
                if (!data.input) data.input = {};
                if (!data.input.faceReference) {
                  data.input.faceReference = { data: null, mimeType: null };
                }
                data.input.faceReference.data = value;
                if (data.input.faceReference.mimeType === null && value && value.startsWith('data:')) {
                  const mimeMatch = value.match(/^data:([^;]+)/);
                  if (mimeMatch) {
                    data.input.faceReference.mimeType = mimeMatch[1];
                  }
                }
              } else if (key === 'fabricReference') {
                if (!data.input) data.input = {};
                if (!data.input.fabricReference) {
                  data.input.fabricReference = { data: null, mimeType: null };
                }
                data.input.fabricReference.data = value;
                if (data.input.fabricReference.mimeType === null && value && value.startsWith('data:')) {
                  const mimeMatch = value.match(/^data:([^;]+)/);
                  if (mimeMatch) {
                    data.input.fabricReference.mimeType = mimeMatch[1];
                  }
                }
              }
            }
          }
          concepts.push(data);
        });
      } else {
        conceptsData.forEach(({ data }) => {
          if (!data.input) {
            data.input = {
              productImages: [],
              faceReference: { data: null, mimeType: null },
              fabricReference: { data: null, mimeType: null }
            };
          }
          concepts.push(data);
        });
      }
      
      console.log(`✅ Đã tải xong ${concepts.length} concepts`);
      return res.json({ success: true, concepts: concepts.reverse() });
    }

    // --- XỬ LÝ XÓA (DELETE) ---
    if (req.method === 'DELETE') {
      if (!conceptId) {
        return res.status(400).json({ success: false, message: 'Thiếu Concept ID' });
      }
      
      console.log(`🗑️ Đang xóa concept: ${conceptId} cho user: ${userId}`);
      
      const list = await drive.files.list({ 
        q: `'${userFolderId}' in parents and mimeType='application/json' and name='concept_${conceptId}.json' and trashed=false`, 
        fields: 'files(id)' 
      });
      
      const jsonFiles = list.data.files || [];
      if (jsonFiles.length === 0) {
        console.warn(`⚠️ Không tìm thấy file JSON cho concept: ${conceptId}`);
        return res.json({ success: true, message: 'Concept không tồn tại hoặc đã bị xóa' });
      }
      
      const jsonFileId = jsonFiles[0].id;
      
      let conceptData;
      try {
        const jsonContent = await drive.files.get({ fileId: jsonFileId, alt: 'media' });
        conceptData = typeof jsonContent.data === 'string' ? JSON.parse(jsonContent.data) : jsonContent.data;
      } catch (e) {
        console.error('Lỗi đọc file JSON:', e.message);
        await drive.files.delete({ fileId: jsonFileId });
        return res.json({ success: true, message: 'Đã xóa file JSON (không đọc được dữ liệu)' });
      }
      
      const fileIdsToDelete = [jsonFileId];
      
      if (conceptData.poses && Array.isArray(conceptData.poses)) {
        conceptData.poses.forEach(pose => {
          if (pose.generated_image && typeof pose.generated_image === 'string' && pose.generated_image.startsWith('DRIVE_FILE:')) {
            const fileId = pose.generated_image.replace('DRIVE_FILE:', '');
            fileIdsToDelete.push(fileId);
          }
        });
      }
      
      if (conceptData.input?.productImages) {
        conceptData.input.productImages.forEach(img => {
          if (img.data && typeof img.data === 'string' && img.data.startsWith('DRIVE_FILE:')) {
            const fileId = img.data.replace('DRIVE_FILE:', '');
            fileIdsToDelete.push(fileId);
          }
        });
      }
      
      if (conceptData.input?.faceReference?.data && typeof conceptData.input.faceReference.data === 'string' && conceptData.input.faceReference.data.startsWith('DRIVE_FILE:')) {
        const fileId = conceptData.input.faceReference.data.replace('DRIVE_FILE:', '');
        fileIdsToDelete.push(fileId);
      }
      
      if (conceptData.input?.fabricReference?.data && typeof conceptData.input.fabricReference.data === 'string' && conceptData.input.fabricReference.data.startsWith('DRIVE_FILE:')) {
        const fileId = conceptData.input.fabricReference.data.replace('DRIVE_FILE:', '');
        fileIdsToDelete.push(fileId);
      }
      
      console.log(`🗑️ Đang xóa ${fileIdsToDelete.length} files`);
      const deletePromises = fileIdsToDelete.map(fileId => 
        drive.files.delete({ fileId })
          .then(() => ({ success: true, fileId }))
          .catch(error => ({ success: false, fileId, error: error.message }))
      );
      
      const deleteResults = await Promise.all(deletePromises);
      const failed = deleteResults.filter(r => !r.success);
      
      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} files không thể xóa:`, failed);
      }
      
      console.log(`✅ Đã xóa ${deleteResults.filter(r => r.success).length}/${fileIdsToDelete.length} files`);
      return res.json({ success: true, message: 'Đã xóa concept và tất cả ảnh liên quan' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Collection API Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}


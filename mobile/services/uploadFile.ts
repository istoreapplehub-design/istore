import { Platform } from "react-native";
import { File, UploadType } from "expo-file-system";

export interface UploadFileInput {
  uri: string;
  name: string;
  type: string;
}

function parseBody(body: string | null): any {
  try {
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

function ensureOk(status: number, data: any): any {
  if (status < 200 || status >= 300) {
    throw new Error(data?.message || data?.error || `Upload failed with status ${status}`);
  }
  return data;
}

// React Native 0.86's fetch rejects {uri,name,type} FormData parts ("Unsupported
// FormDataPart implementation"), so native uploads must go through expo-file-system.
async function uploadNative(
  url: string,
  file: UploadFileInput,
  fieldName: string,
  headers: Record<string, string>
): Promise<any> {
  const result = await new File(file.uri).upload(url, {
    uploadType: UploadType.MULTIPART,
    fieldName,
    mimeType: file.type || "image/jpeg",
    headers
  });
  return ensureOk(result.status, parseBody(result.body));
}

async function uploadWeb(
  url: string,
  files: UploadFileInput[],
  fieldName: string,
  headers: Record<string, string>
): Promise<any> {
  const formData = new FormData();
  for (const file of files) {
    const blob = await (await fetch(file.uri)).blob();
    formData.append(fieldName, blob, file.name);
  }
  const res = await fetch(url, { method: "POST", headers, body: formData });
  return ensureOk(res.status, await res.json().catch(() => null));
}

export async function uploadFile(
  url: string,
  file: UploadFileInput,
  fieldName: string,
  headers: Record<string, string> = {}
): Promise<any> {
  if (Platform.OS === "web") {
    return uploadWeb(url, [file], fieldName, headers);
  }
  return uploadNative(url, file, fieldName, headers);
}
